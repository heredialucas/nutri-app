"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { normalizeDni, isValidDni } from "@/lib/dni";
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

async function findPatientByDni(dni: string) {
    const normalized = normalizeDni(dni);
    if (!normalized) return null;
    return prisma.patient.findUnique({ where: { documentNumber: normalized } });
}

async function resolveIsFirstAppointment(
    dni?: string | null,
    email?: string | null,
): Promise<boolean> {
    const { appointmentService } = await import("@/services/appointment-service");

    let patientId: string | null = null;

    const user = await getCurrentUser();
    if (user && isPatientUser(user)) {
        const { patientService } = await import("@/services/patient-service");
        const patient = await patientService.getByUserId(user.id);
        patientId = patient?.id ?? null;
    }

    if (!patientId && dni) {
        const existing = await findPatientByDni(dni);
        patientId = existing?.id ?? null;
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

export async function lookupMemberByDni(dni: string) {
    const { memberLookupService } = await import("@/services/member-lookup-service");
    return memberLookupService.lookupByDni(dni);
}

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "RESCHEDULED"] as const;

/**
 * Devuelve el próximo turno activo (pendiente/confirmado) de un DNI, si existe.
 * Regla de negocio: cada DNI debe tener un solo turno activo a la vez.
 */
export async function getActiveAppointmentByDni(dni: string) {
    const normalized = normalizeDni(dni);
    if (!isValidDni(normalized)) return null;

    const patient = await findPatientByDni(normalized);
    if (!patient) return null;

    const appointment = await prisma.appointment.findFirst({
        where: {
            patientId: patient.id,
            status: { in: [...ACTIVE_STATUSES] },
            startAt: { gt: new Date() },
        },
        orderBy: { startAt: "asc" },
        include: {
            sede: { select: { name: true, address: true } },
        },
    });

    if (!appointment) return null;

    return {
        id: appointment.id,
        dateLabel: formatInTimeZone(appointment.startAt, AR_TZ, "EEEE d 'de' MMMM", {
            locale: es,
        }),
        timeLabel: formatInTimeZone(appointment.startAt, AR_TZ, "HH:mm"),
        typeLabel: appointment.type === "ONLINE" ? "Online" : "Presencial",
        locationLabel:
            appointment.type === "ONLINE"
                ? null
                : appointment.sede
                  ? `${appointment.sede.name} — ${appointment.sede.address}`
                  : appointment.location,
    };
}

export async function getPublicAvailableSlots(
    date: string,
    locationId?: string | null,
    dni?: string | null,
    email?: string | null,
) {
    const professionalId = await getDefaultProfessionalId();
    const { availabilityService } = await import("@/services/availability-service");
    // date string is the Argentina-local date the user picked (e.g. "2026-08-27")
    // fromZonedTime interprets the given date+time as AR time and returns correct UTC
    const [y, m, d] = date.split("-").map(Number);
    const localNoon = new Date(y, m - 1, d, 12, 0, 0);
    const utcDate = fromZonedTime(localNoon, AR_TZ);

    // Primera consulta: reservar 45 min completos. El resto usa la duración del bloque.
    const isFirstAppointment = await resolveIsFirstAppointment(dni, email);
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
    dni: string;
    type: "ONLINE" | "IN_PERSON";
    locationId?: string;
    date: string;
    time: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    goal?: string;
    replaceExisting?: boolean;
}) {
    const dni = normalizeDni(data.dni);
    if (!data.firstName?.trim()) throw new Error("El nombre es obligatorio");
    if (!data.lastName?.trim()) throw new Error("El apellido es obligatorio");
    if (!isValidDni(dni)) throw new Error("Ingresá un DNI válido (7 u 8 dígitos)");
    if (!data.phone?.trim()) throw new Error("El celular es obligatorio");
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

    const { blockedDayService } = await import("@/services/blocked-day-service");
    if (await blockedDayService.isBlocked(professionalId, startAtCheck)) {
        throw new Error("Ese día no está disponible. Elegí otra fecha.");
    }

    const email = data.email?.trim() || undefined;
    const phone = data.phone?.trim() || undefined;

    // Buscar la ficha del paciente por DNI (identificador principal)
    let patient = await findPatientByDni(dni);

    if (!patient && email) {
        // Compatibilidad con fichas viejas sin DNI cargado
        const byEmail = await prisma.patient.findFirst({
            where: { email, deletedAt: null },
        });
        if (byEmail && !byEmail.documentNumber) {
            patient = await prisma.patient.update({
                where: { id: byEmail.id },
                data: { documentNumber: dni },
            });
        }
    }

    if (patient) {
        // Reactivar ficha archivada y completar solo datos que falten
        await prisma.patient.update({
            where: { id: patient.id },
            data: {
                deletedAt: null,
                phone: patient.phone || phone,
                email: patient.email || email,
                birthDate:
                    patient.birthDate ||
                    (data.birthDate ? new Date(data.birthDate) : undefined),
            },
        });
    } else {
        patient = await prisma.patient.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                documentNumber: dni,
                email,
                phone,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                billingType: "particular",
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

    const appointmentInclude = {
        patient: { select: { id: true, firstName: true, lastName: true } },
        professional: { select: { id: true, fullName: true } },
    } as const;

    // Idempotencia: si el paciente ya tiene un turno en ese mismo horario,
    // devolverlo en lugar de crear un duplicado (reintentos del flujo).
    let appointment = await prisma.appointment.findFirst({
        where: {
            patientId: patient.id,
            startAt,
            status: { in: [...ACTIVE_STATUSES] },
        },
        include: appointmentInclude,
    });

    const isNewAppointment = !appointment;

    if (isNewAppointment) {
        // Regla: un solo turno activo por DNI.
        const otherActive = await prisma.appointment.findMany({
            where: {
                patientId: patient.id,
                status: { in: [...ACTIVE_STATUSES] },
                startAt: { gt: new Date() },
            },
            orderBy: { startAt: "asc" },
        });

        if (otherActive.length > 0) {
            if (!data.replaceExisting) {
                const next = otherActive[0];
                const label = formatInTimeZone(next.startAt, AR_TZ, "d 'de' MMMM 'a las' HH:mm", {
                    locale: es,
                });
                throw new Error(
                    `Ya tenés un turno reservado para el ${label}. Podés reprogramarlo desde tu panel o confirmar el cambio al reservar de nuevo.`,
                );
            }

            // Reemplazo confirmado: cancelar los turnos activos previos
            await prisma.appointment.updateMany({
                where: { id: { in: otherActive.map((a) => a.id) } },
                data: {
                    status: "CANCELLED",
                    cancellationReason: "Reemplazado por una nueva reserva",
                },
            });

            const { notificationService } = await import(
                "@/services/notification-service"
            );
            for (const old of otherActive) {
                await notificationService.notifyAppointmentEvent(old.id, "CANCELLED", {
                    reason: "Reemplazado por una nueva reserva",
                });
            }
        }

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

        appointment = await prisma.appointment.create({
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
            include: appointmentInclude,
        });

        revalidatePath("/dashboard/turnos");
    }

    // Aprovisionar cuenta de paciente por DNI. No se inicia sesión acá: el
    // paciente debe crear su contraseña (activación) para poder entrar.
    const { patientAccountService } = await import(
        "@/services/patient-account-service"
    );
    let accountCreated = false;
    let mustSetPassword = true;
    try {
        const { user, created } = await patientAccountService.provisionByDni(dni);
        accountCreated = created;
        mustSetPassword = user.mustSetPassword;

        if (!patient.userId) {
            await prisma.patient.update({
                where: { id: patient.id },
                data: { userId: user.id },
            });
        }

        // Cuenta recién creada en esta reserva: habilitar activación sin email.
        if (created) {
            const { authService } = await import("@/services/auth-service");
            const token = await authService.issueActivationToken({
                dni,
                email: email ?? null,
            });
            const cookieStore = await cookies();
            cookieStore.set("activation_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24,
                path: "/",
            });
        }
    } catch (error) {
        console.error(
            "[public-booking] No se pudo aprovisionar la cuenta:",
            error instanceof Error ? error.message : error,
        );
    }

    // Solo notificar cuando el turno es realmente nuevo (evita emails duplicados)
    if (isNewAppointment && appointment) {
        const { notificationService } = await import("@/services/notification-service");
        await notificationService.notifyAppointmentEvent(appointment.id, "CREATED");
        await notificationService.notifyPatientBooking(appointment.id);
    }

    return {
        appointment: serializePrisma(appointment),
        patient: serializePrisma(patient),
        accountCreated,
        mustSetPassword,
    };
}
