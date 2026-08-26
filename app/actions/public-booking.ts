"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

async function getDefaultProfessionalId(): Promise<string> {
    const admin = await prisma.user.findFirst({
        where: {
            email: "admin@mauroacosta.com",
            isActive: true,
        },
        select: { id: true },
    });

    if (!admin) {
        const anyProfessional = await prisma.user.findFirst({
            where: { isActive: true },
            select: { id: true },
        });
        if (!anyProfessional) throw new Error("No hay profesionales disponibles");
        return anyProfessional.id;
    }

    return admin.id;
}

export async function getPublicAvailableSlots(date: string) {
    const professionalId = await getDefaultProfessionalId();
    const { availabilityService } = await import("@/services/availability-service");
    // date string is the Argentina-local date the user picked (e.g. "2026-08-27")
    // fromZonedTime interprets the given date+time as AR time and returns correct UTC
    const [y, m, d] = date.split("-").map(Number);
    const localNoon = new Date(y, m - 1, d, 12, 0, 0);
    const utcDate = fromZonedTime(localNoon, AR_TZ);
    const slots = await availabilityService.getAvailableSlots(professionalId, utcDate);
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
    date: string;
    time: string;
}) {
    if (!data.firstName?.trim()) throw new Error("El nombre es obligatorio");
    if (!data.lastName?.trim()) throw new Error("El apellido es obligatorio");
    if (!data.email?.trim()) throw new Error("El email es obligatorio");
    if (!data.phone?.trim()) throw new Error("El teléfono es obligatorio");
    if (!data.date) throw new Error("La fecha es obligatoria");
    if (!data.time) throw new Error("El horario es obligatorio");

    const professionalId = await getDefaultProfessionalId();

    // Find or create patient
    let patient = await prisma.patient.findFirst({
        where: {
            email: data.email.trim(),
            deletedAt: null,
        },
    });

    if (!patient) {
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

    // Calculate end time (30 min slots) - interpret as Argentina time, store as UTC
    const [y, m, d] = data.date.split("-").map(Number);
    const [h, min] = data.time.split(":").map(Number);
    const localStart = new Date(y, m - 1, d, h, min, 0);
    const startAt = fromZonedTime(localStart, AR_TZ);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

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
