"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import {
    DEFAULT_SLOT_DURATION,
    FIRST_CONSULTATION_DURATION_MINUTES,
    getEffectiveDurationMinutes,
} from "@/lib/appointment-rules";

const AR_TZ = "America/Argentina/Buenos_Aires";

async function getDefaultProfessionalId(): Promise<string> {
    const { professionalService } = await import("@/services/professional-service");
    return professionalService.getDefaultProfessionalId();
}

async function resolveIsFirstAppointment(email?: string | null): Promise<boolean> {
    const { appointmentService } = await import("@/services/appointment-service");

    let patientId: string | null = null;

    const user = await getCurrentUser();
    if (user && isPatientUser(user)) {
        const { patientService } = await import("@/services/patient-service");
        const patient = await patientService.getByUserId(user.id);
        patientId = patient?.id ?? null;
    }

    if (!patientId && email?.trim()) {
        const existing = await prisma.patient.findFirst({
            where: { email: email.trim(), deletedAt: null },
            select: { id: true },
        });
        patientId = existing?.id ?? null;
    }

    // Sin paciente asociado => primera consulta
    if (!patientId) return true;

    return appointmentService.isFirstAppointment(patientId);
}

export async function getPublicLocations() {
    const { locationService } = await import("@/services/location-service");
    return locationService.listActive();
}

export async function getPublicAvailableSlots(date: string, locationId?: string | null, email?: string | null) {
    const professionalId = await getDefaultProfessionalId();
    const { availabilityService } = await import("@/services/availability-service");
    // date string is the Argentina-local date the user picked (e.g. "2026-08-27")
    // fromZonedTime interprets the given date+time as AR time and returns correct UTC
    const [y, m, d] = date.split("-").map(Number);
    const localNoon = new Date(y, m - 1, d, 12, 0, 0);
    const utcDate = fromZonedTime(localNoon, AR_TZ);

    // Primera consulta: reservar 45 min completos. El resto usa la duración del bloque.
    const isFirstAppointment = await resolveIsFirstAppointment(email);
    const opts = isFirstAppointment
        ? { duration: FIRST_CONSULTATION_DURATION_MINUTES }
        : undefined;

    const slots = await availabilityService.getAvailableSlots(
        professionalId,
        utcDate,
        locationId ?? null,
        opts,
    );
    return slots;
}

export async function createPublicBooking(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate?: string;
    goal?: string;
    billingType: string;
    type: "ONLINE" | "IN_PERSON";
    locationId?: string;
    date: string;
    time: string;
}) {
    if (!data.firstName?.trim()) throw new Error("El nombre es obligatorio");
    if (!data.lastName?.trim()) throw new Error("El apellido es obligatorio");
    if (!data.email?.trim()) throw new Error("El email es obligatorio");
    if (!data.phone?.trim()) throw new Error("El teléfono es obligatorio");
    if (!data.date) throw new Error("La fecha es obligatoria");
    if (!data.time) throw new Error("El horario es obligatorio");

    // Los turnos presenciales requieren una sede válida
    let sede: { id: string; name: string; address: string } | null = null;
    if (data.type === "IN_PERSON") {
        if (!data.locationId) throw new Error("Elegí la sede del turno presencial");
        const { locationService } = await import("@/services/location-service");
        const found = await locationService.getById(data.locationId);
        if (!found || !found.isActive) throw new Error("La sede elegida no está disponible");
        sede = { id: found.id, name: found.name, address: found.address };
    }

    // Prevent booking past dates/times
    const [y, m, d] = data.date.split("-").map(Number);
    const [h, min] = data.time.split(":").map(Number);
    const localStart = new Date(y, m - 1, d, h, min, 0);
    const startAtCheck = fromZonedTime(localStart, AR_TZ);
    if (startAtCheck.getTime() <= Date.now()) {
        throw new Error("No se puede reservar un turno en el pasado. Elegí un horario futuro.");
    }

    const professionalId = await getDefaultProfessionalId();

    // Find or create patient
    let patient = await prisma.patient.findFirst({
        where: {
            email: data.email.trim(),
            deletedAt: null,
        },
    });

    if (patient) {
        // Backfill: si el paciente existente no tiene teléfono, guardar el aportado en la reserva
        if (!patient.phone && data.phone?.trim()) {
            const phone = data.phone.trim();
            await prisma.patient.update({
                where: { id: patient.id },
                data: { phone },
            });
            patient.phone = phone;
        }
    } else {
        patient = await prisma.patient.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim(),
                phone: data.phone.trim(),
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                billingType: data.billingType,
                notes: data.goal?.trim() || undefined,
            },
        });
    }

    // Duración: primera consulta 45 min; el resto usa la duración del bloque de disponibilidad
    const { appointmentService } = await import("@/services/appointment-service");
    const { availabilityService } = await import("@/services/availability-service");
    const isFirstAppointment = await appointmentService.isFirstAppointment(patient.id);
    const baseDuration =
        (await availabilityService.resolveSlotDuration(
            professionalId,
            startAtCheck,
            data.type === "IN_PERSON" ? sede?.id ?? null : null,
            data.time,
        )) ?? DEFAULT_SLOT_DURATION;
    const duration = getEffectiveDurationMinutes(baseDuration, isFirstAppointment);

    const startAt = startAtCheck;
    const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

    // Check for conflicts
    const conflict = await prisma.appointment.findFirst({
        where: {
            professionalId,
            status: { notIn: ["CANCELLED"] },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
        },
    });

    if (conflict) {
        throw new Error("Ese horario ya fue ocupado. Elegí otro.");
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
        data: {
            patientId: patient.id,
            professionalId,
            type: data.type,
            status: "PENDING",
            startAt,
            endAt,
            locationId: sede?.id,
            location: sede ? `${sede.name} — ${sede.address}` : undefined,
            notes: data.goal?.trim() || undefined,
        },
        include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            professional: { select: { id: true, fullName: true } },
        },
    });

    revalidatePath("/dashboard/turnos");

    return {
        appointment: serializePrisma(appointment),
        patient: serializePrisma(patient),
    };
}
