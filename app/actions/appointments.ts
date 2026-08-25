"use server";

import { appointmentService } from "@/services/appointment-service";
import { getCurrentUser, hasPermission, isPatientUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

async function requireAuth(permission?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (permission && !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
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
    } else if (filters?.professionalId) {
        queryFilters.professionalId = filters.professionalId;
    } else {
        queryFilters.professionalId = user.id;
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

export async function createAppointment(data: {
    patientId: string;
    professionalId: string;
    type: "ONLINE" | "IN_PERSON";
    startAt: string;
    endAt: string;
    location?: string;
    meetingUrl?: string;
    notes?: string;
}) {
    await requireAuth("appointments:create");

    if (!data.patientId) throw new Error("El paciente es obligatorio");
    if (!data.startAt || !data.endAt) throw new Error("Las fechas son obligatorias");

    const appointment = await appointmentService.create({
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
    });

    revalidatePath("/dashboard/appointments");
    return serializePrisma(appointment);
}

export async function updateAppointment(id: string, data: {
    status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
    notes?: string;
    cancellationReason?: string;
    startAt?: string;
    endAt?: string;
    meetingUrl?: string;
}) {
    await requireAuth("appointments:update");

    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.cancellationReason !== undefined) updateData.cancellationReason = data.cancellationReason;
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl;

    const appointment = await appointmentService.update(id, updateData);
    revalidatePath("/dashboard/appointments");
    revalidatePath(`/dashboard/appointments/${id}`);
    return serializePrisma(appointment);
}

export async function cancelAppointment(id: string, reason?: string) {
    await requireAuth("appointments:update");
    await appointmentService.cancel(id, reason);
    revalidatePath("/dashboard/appointments");
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
