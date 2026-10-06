import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { fromZonedTime, formatInTimeZone, toZonedTime } from "date-fns-tz";
import { blockedDayService } from "@/services/blocked-day-service";

const AR_TZ = "America/Argentina/Buenos_Aires";

type AvailabilityBlock = {
    startTime: string;
    endTime: string;
    slotDuration: number;
};

type AppointmentRange = {
    startAt: Date;
    endAt: Date;
};

/**
 * Calcula los cupos de un día concreto aplicando las reglas de negocio:
 * - La duración efectiva puede ser mayor que el bloque (primera consulta 45 min).
 * - Se descartan cupos ya ocupados por turnos existentes.
 * - Si el día es hoy (hora Argentina), se descartan cupos ya pasados.
 */
function buildDaySlots(params: {
    arDateStr: string;
    availability: AvailabilityBlock[];
    existingAppointments: AppointmentRange[];
    isToday: boolean;
    currentTimeStr: string;
    opts?: { duration?: number };
}) {
    const { arDateStr, availability, existingAppointments, isToday, currentTimeStr, opts } =
        params;

    const slots: { time: string; available: boolean; duration: number }[] = [];

    for (const block of availability) {
        const [startH, startM] = block.startTime.split(":").map(Number);
        const [endH, endM] = block.endTime.split(":").map(Number);
        const step = block.slotDuration;
        const duration =
            opts?.duration && opts.duration > 0 ? opts.duration : block.slotDuration;

        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // The slot only fits if the full effective duration stays within the block
        while (currentMinutes + duration <= endMinutes) {
            const h = Math.floor(currentMinutes / 60);
            const m = currentMinutes % 60;
            const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

            // Skip past time slots for today
            if (isToday && currentTimeStr && time <= currentTimeStr) {
                currentMinutes += step;
                continue;
            }

            // Build a pretend-UTC date with the AR local time, then convert to real UTC
            const pretendLocal = new Date(
                `${arDateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
            );
            const slotStart = fromZonedTime(pretendLocal, AR_TZ);
            const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

            const isBooked = existingAppointments.some(
                (apt) => apt.startAt < slotEnd && apt.endAt > slotStart,
            );

            slots.push({ time, available: !isBooked, duration });
            currentMinutes += step;
        }
    }

    return slots;
}

export const availabilityService = {
    async getByProfessional(professionalId: string, locationId: string | null = null) {
        return prisma.availability.findMany({
            where: { professionalId, locationId: locationId ?? null },
            orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        });
    },

    async getAllByProfessional(professionalId: string) {
        return prisma.availability.findMany({
            where: { professionalId },
            orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        });
    },

    async create(data: {
        professionalId: string;
        locationId: string | null;
        weekday: number;
        startTime: string;
        endTime: string;
        slotDuration?: number;
    }) {
        // Verificar que no haya superposición en el mismo día para la misma sede/Online
        const existing = await prisma.availability.findMany({
            where: {
                professionalId: data.professionalId,
                locationId: data.locationId ?? null,
                weekday: data.weekday,
                isActive: true,
            },
        });

        const hasConflict = existing.some((slot) => {
            return data.startTime < slot.endTime && data.endTime > slot.startTime;
        });

        if (hasConflict) {
            throw new Error("Ya existe un bloque de disponibilidad que se superpone en ese día");
        }

        return prisma.availability.create({ data });
    },

    async update(id: string, data: {
        startTime?: string;
        endTime?: string;
        slotDuration?: number;
        isActive?: boolean;
    }) {
        return prisma.availability.update({
            where: { id },
            data,
        });
    },

    async delete(id: string) {
        return prisma.availability.delete({ where: { id } });
    },

    async resolveSlotDuration(
        professionalId: string,
        date: Date,
        locationId: string | null,
        time: string,
    ) {
        const arDate = toZonedTime(date, AR_TZ);
        const weekday = arDate.getDay();

        const blocks = await prisma.availability.findMany({
            where: {
                professionalId,
                locationId: locationId ?? null,
                weekday,
                isActive: true,
            },
        });

        const block = blocks.find((b) => time >= b.startTime && time < b.endTime);
        return block?.slotDuration ?? null;
    },

    async getAvailableSlots(
        professionalId: string,
        date: Date,
        locationId: string | null = null,
        opts?: { duration?: number; excludeAppointmentId?: string },
    ) {
        // date is a correct UTC Date; get Argentina weekday
        const arDate = toZonedTime(date, AR_TZ);
        const weekday = arDate.getDay();

        const availability = await prisma.availability.findMany({
            where: {
                professionalId,
                locationId: locationId ?? null,
                weekday,
                isActive: true,
            },
        });

        // Get Argentina date string for the day range
        const arDateStr = formatInTimeZone(date, AR_TZ, "yyyy-MM-dd");

        // Día bloqueado por el profesional: no se ofrecen turnos
        const isBlocked = await blockedDayService.isBlocked(professionalId, date);
        if (isBlocked) return [];

        const dayStart = new Date(`${arDateStr}T00:00:00Z`);
        const dayEnd = new Date(`${arDateStr}T23:59:59Z`);

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                professionalId,
                startAt: { gte: dayStart, lte: dayEnd },
                status: { notIn: ["CANCELLED"] },
                ...(opts?.excludeAppointmentId ? { id: { not: opts.excludeAppointmentId } } : {}),
            },
            select: { startAt: true, endAt: true },
        });

        // Determine if the requested date is today in Argentina timezone
        const nowArStr = formatInTimeZone(new Date(), AR_TZ, "yyyy-MM-dd");
        const isToday = arDateStr === nowArStr;

        // If today, get current time in "HH:mm" format for comparison
        const currentTimeStr = isToday
            ? formatInTimeZone(new Date(), AR_TZ, "HH:mm")
            : "";

        return buildDaySlots({
            arDateStr,
            availability,
            existingAppointments,
            isToday,
            currentTimeStr,
            opts,
        });
    },

    /**
     * Devuelve los días del mes (formato "yyyy-MM-dd", hora Argentina) que tienen
     * al menos un cupo libre para el profesional y la sede indicada.
     * Se apoya en las mismas reglas que `getAvailableSlots` (bloqueados, ocupados,
     * hora actual y duración efectiva) pero resolviendo todo el mes en pocas consultas.
     */
    async getAvailableDaysInMonth(
        professionalId: string,
        year: number,
        month: number,
        locationId: string | null = null,
        opts?: { duration?: number },
    ) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const mm = String(month).padStart(2, "0");
        const fromStr = `${year}-${mm}-01`;
        const toStr = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`;

        const availability = await prisma.availability.findMany({
            where: {
                professionalId,
                locationId: locationId ?? null,
                isActive: true,
            },
        });

        if (availability.length === 0) return [];

        const blocksByWeekday = new Map<number, AvailabilityBlock[]>();
        for (const block of availability) {
            const list = blocksByWeekday.get(block.weekday) ?? [];
            list.push(block);
            blocksByWeekday.set(block.weekday, list);
        }

        const blockedDays = await blockedDayService.listByRange(professionalId, fromStr, toStr);
        const blockedSet = new Set(blockedDays.map((day) => day.date));

        const monthStart = new Date(`${fromStr}T00:00:00Z`);
        const monthEnd = new Date(`${toStr}T23:59:59Z`);

        const appointments = await prisma.appointment.findMany({
            where: {
                professionalId,
                startAt: { gte: monthStart, lte: monthEnd },
                status: { notIn: ["CANCELLED"] },
            },
            select: { startAt: true, endAt: true },
        });

        const nowArStr = formatInTimeZone(new Date(), AR_TZ, "yyyy-MM-dd");
        const currentTimeStr = formatInTimeZone(new Date(), AR_TZ, "HH:mm");

        const availableDays: string[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const arDateStr = `${year}-${mm}-${String(day).padStart(2, "0")}`;

            // Días pasados no se ofrecen
            if (arDateStr < nowArStr) continue;
            if (blockedSet.has(arDateStr)) continue;

            const localNoon = new Date(year, month - 1, day, 12, 0, 0);
            const utcNoon = fromZonedTime(localNoon, AR_TZ);
            const weekday = toZonedTime(utcNoon, AR_TZ).getDay();

            const dayBlocks = blocksByWeekday.get(weekday);
            if (!dayBlocks || dayBlocks.length === 0) continue;

            const dayStart = new Date(`${arDateStr}T00:00:00Z`);
            const dayEnd = new Date(`${arDateStr}T23:59:59Z`);
            const dayAppointments = appointments.filter(
                (apt) => apt.startAt >= dayStart && apt.startAt <= dayEnd,
            );

            const slots = buildDaySlots({
                arDateStr,
                availability: dayBlocks,
                existingAppointments: dayAppointments,
                isToday: arDateStr === nowArStr,
                currentTimeStr,
                opts,
            });

            if (slots.some((slot) => slot.available)) {
                availableDays.push(arDateStr);
            }
        }

        return availableDays;
    },
};
