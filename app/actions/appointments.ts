"use server";

import { appointmentService } from "@/services/appointment-service";
import { availabilityService } from "@/services/availability-service";
import { locationService } from "@/services/location-service";
import { professionalService } from "@/services/professional-service";
import { getCurrentUser, hasPermission, isPatientUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { fromZonedTime } from "date-fns-tz";
import {
    FIRST_APPOINTMENT_STATUSES,
    getEffectiveDurationMinutes,
    minutesBetween,
} from "@/lib/appointment-rules";
import prisma from "@/lib/prisma";

const AR_TZ = "America/Argentina/Buenos_Aires";

async function requireAuth(permission?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (permission && !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
}

function parseArDateTime(date: string, time: string) {
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    if (!y || !m || !d || Number.isNaN(h) || Number.isNaN(min)) {
        throw new Error("Fecha u horario inválidos");
    }
    return fromZonedTime(new Date(y, m - 1, d, h, min, 0), AR_TZ);
}

function dateToUtc(date: string) {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) throw new Error("Fecha inválida");
    return fromZonedTime(new Date(y, m - 1, d, 12, 0, 0), AR_TZ);
}

function revalidateAppointmentPaths(id?: string) {
    revalidatePath("/dashboard/turnos");
    revalidatePath("/dashboard/turnos/calendario");
    revalidatePath("/dashboard");
    if (id) revalidatePath(`/dashboard/turnos/${id}`);
}

export async function getAppointments(filters?: {
    professionalId?: string;
    patientId?: string;
    status?: string;
    from?: string;
    to?: string;
}) {
    const user = await requireAuth("appointments:read");

    const queryFilters: Record<string, any> = {};
    if (filters?.status) queryFilters.status = filters.status;
    if (filters?.from) queryFilters.from = new Date(filters.from);
    if (filters?.to) queryFilters.to = new Date(filters.to);

    if (isPatientUser(user)) {
        // Pacientes ven solo sus propios turnos
        const { patientService } = await import("@/services/patient-service");
        const patient = await patientService.getByUserId(user.id);
        if (patient) queryFilters.patientId = patient.id;
    } else {
        // Profesional único de la agenda: Mauro Acosta (admin)
        queryFilters.professionalId = await professionalService.getDefaultProfessionalId();
    }

    if (filters?.patientId && !isPatientUser(user)) {
        queryFilters.patientId = filters.patientId;
    }

    const appointments = await appointmentService.list(queryFilters);
    return serializePrisma(appointments);
}

export async function getAppointmentById(id: string) {
    const user = await requireAuth("appointments:read");
    const appointment = await appointmentService.getById(id);

    if (!appointment) throw new Error("Turno no encontrado");

    if (isPatientUser(user)) {
        const { patientService } = await import("@/services/patient-service");
        const patient = await patientService.getByUserId(user.id);
        if (patient?.id !== appointment.patientId) {
            throw new Error("No tienes acceso a este turno");
        }
    }

    return serializePrisma(appointment);
}

export async function getAppointmentFormOptions() {
    await requireAuth("appointments:read");

    const [patients, locations, professional, grouped] = await Promise.all([
        prisma.patient.findMany({
            where: { deletedAt: null },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        }),
        locationService.listActive(),
        professionalService.getDefaultProfessional(),
        prisma.appointment.groupBy({
            by: ["patientId"],
            where: { status: { in: [...FIRST_APPOINTMENT_STATUSES] } },
            _count: { _all: true },
        }),
    ]);

    const withAppointments = new Set(grouped.map((g) => g.patientId));

    if (!professional) throw new Error("No hay profesional configurado");

    return serializePrisma({
        patients: patients.map((p) => ({
            ...p,
            isFirstAppointment: !withAppointments.has(p.id),
        })),
        locations: locations.map((l) => ({ id: l.id, name: l.name, address: l.address })),
        professional,
    });
}

export async function getAppointmentSlots(data: {
    date: string;
    locationId?: string | null;
    duration?: number;
    excludeAppointmentId?: string;
}) {
    await requireAuth("appointments:read");
    if (!data.date) return [];

    const professionalId = await professionalService.getDefaultProfessionalId();

    const slots = await availabilityService.getAvailableSlots(
        professionalId,
        dateToUtc(data.date),
        data.locationId ?? null,
        { duration: data.duration, excludeAppointmentId: data.excludeAppointmentId },
    );
    return slots;
}

export async function isPatientFirstAppointment(patientId: string) {
    await requireAuth("appointments:read");
    return appointmentService.isFirstAppointment(patientId);
}

export async function createAppointment(data: {
    patientId: string;
    type: "ONLINE" | "IN_PERSON";
    date?: string;
    time?: string;
    startAt?: string;
    endAt?: string;
    durationMinutes?: number;
    locationId?: string | null;
    meetingUrl?: string;
    notes?: string;
}) {
    await requireAuth("appointments:create");

    if (!data.patientId) throw new Error("El paciente es obligatorio");
    if (data.type !== "ONLINE" && data.type !== "IN_PERSON") {
        throw new Error("El tipo de turno es obligatorio");
    }

    const professionalId = await professionalService.getDefaultProfessionalId();

    let startAt: Date;
    if (data.date && data.time) {
        startAt = parseArDateTime(data.date, data.time);
    } else if (data.startAt) {
        startAt = new Date(data.startAt);
    } else {
        throw new Error("La fecha y el horario son obligatorios");
    }
    if (Number.isNaN(startAt.getTime())) throw new Error("Fecha u horario inválidos");

    const isFirst = await appointmentService.isFirstAppointment(data.patientId);

    let baseDuration = data.durationMinutes;
    if (!baseDuration) {
        if (data.date && data.time) {
            baseDuration =
                (await availabilityService.resolveSlotDuration(
                    professionalId,
                    startAt,
                    data.type === "IN_PERSON" ? data.locationId ?? null : null,
                    data.time,
                )) ?? 30;
        } else if (data.endAt) {
            baseDuration = minutesBetween(startAt, new Date(data.endAt));
        } else {
            baseDuration = 30;
        }
    }

    const duration = getEffectiveDurationMinutes(baseDuration, isFirst);
    const endAt = data.endAt ? new Date(data.endAt) : new Date(startAt.getTime() + duration * 60 * 1000);
    if (endAt <= startAt) {
        throw new Error("El horario de fin debe ser posterior al de inicio");
    }

    let locationId: string | null = null;
    let location: string | undefined;
    if (data.type === "IN_PERSON") {
        if (!data.locationId) throw new Error("Elegí la sede del turno presencial");
        const sede = await locationService.getById(data.locationId);
        if (!sede || !sede.isActive) throw new Error("La sede elegida no está disponible");
        locationId = sede.id;
        location = `${sede.name} — ${sede.address}`;
    }

    const appointment = await appointmentService.create({
        patientId: data.patientId,
        professionalId,
        type: data.type,
        startAt,
        endAt,
        locationId,
        location,
        meetingUrl: data.type === "ONLINE" ? data.meetingUrl?.trim() || undefined : undefined,
        notes: data.notes?.trim() || undefined,
    });

    revalidateAppointmentPaths(appointment.id);
    return serializePrisma(appointment);
}

export async function updateAppointment(id: string, data: {
    status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
    notes?: string;
    cancellationReason?: string;
    startAt?: string;
    endAt?: string;
    locationId?: string | null;
    meetingUrl?: string;
}) {
    await requireAuth("appointments:update");

    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.cancellationReason !== undefined) updateData.cancellationReason = data.cancellationReason;
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
    if (data.locationId !== undefined) updateData.locationId = data.locationId;
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl;

    const appointment = await appointmentService.update(id, updateData);
    revalidateAppointmentPaths(id);
    return serializePrisma(appointment);
}

export async function markAppointmentCompleted(id: string) {
    await requireAuth("appointments:update");
    const appointment = await appointmentService.update(id, { status: "COMPLETED" });
    revalidateAppointmentPaths(id);
    return serializePrisma(appointment);
}

export async function markAppointmentNoShow(id: string) {
    await requireAuth("appointments:update");
    const appointment = await appointmentService.update(id, { status: "NO_SHOW" });
    revalidateAppointmentPaths(id);
    return serializePrisma(appointment);
}

export async function rescheduleAppointment(id: string, data: {
    date: string;
    time: string;
    type?: "ONLINE" | "IN_PERSON";
    durationMinutes?: number;
    locationId?: string | null;
    meetingUrl?: string;
    notes?: string;
}) {
    await requireAuth("appointments:update");

    const existing = await appointmentService.getById(id);
    if (!existing) throw new Error("Turno no encontrado");
    if (existing.status === "CANCELLED") throw new Error("No se puede reprogramar un turno cancelado");

    const type = data.type ?? existing.type;
    const startAt = parseArDateTime(data.date, data.time);
    const baseDuration = data.durationMinutes || minutesBetween(existing.startAt, existing.endAt);
    const endAt = new Date(startAt.getTime() + baseDuration * 60 * 1000);

    let locationId: string | null = null;
    let location: string | undefined;
    if (type === "IN_PERSON") {
        const targetLocationId = data.locationId ?? existing.locationId;
        if (!targetLocationId) throw new Error("Elegí la sede del turno presencial");
        const sede = await locationService.getById(targetLocationId);
        if (!sede || !sede.isActive) throw new Error("La sede elegida no está disponible");
        locationId = sede.id;
        location = `${sede.name} — ${sede.address}`;
    }

    const appointment = await appointmentService.reschedule(id, {
        startAt,
        endAt,
        type,
        locationId,
        location,
        meetingUrl: type === "ONLINE" ? data.meetingUrl?.trim() || existing.meetingUrl || undefined : undefined,
        notes: data.notes !== undefined ? data.notes : existing.notes ?? undefined,
    });

    revalidateAppointmentPaths(id);
    return serializePrisma(appointment);
}

export async function cancelAppointment(id: string, reason?: string) {
    await requireAuth("appointments:update");
    const trimmed = reason?.trim();
    if (!trimmed) throw new Error("El motivo de cancelación es obligatorio");
    await appointmentService.cancel(id, trimmed);
    revalidateAppointmentPaths(id);
    return { success: true };
}

export async function getTodayAppointments() {
    const user = await requireAuth("appointments:read");
    if (isPatientUser(user)) throw new Error("Esta función es solo para profesionales");

    const appointments = await appointmentService.getTodayAppointments(user.id);
    return serializePrisma(appointments);
}

export async function getUpcomingCount() {
    const user = await requireAuth("appointments:read");
    if (isPatientUser(user)) throw new Error("Esta función es solo para profesionales");

    return appointmentService.getUpcomingCount(user.id);
}
