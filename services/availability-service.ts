import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { fromZonedTime, formatInTimeZone, toZonedTime } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

export const availabilityService = {
    async getByProfessional(professionalId: string) {
        return prisma.availability.findMany({
            where: { professionalId },
            orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        });
    },

    async create(data: {
        professionalId: string;
        weekday: number;
        startTime: string;
        endTime: string;
        slotDuration?: number;
    }) {
        // Verificar que no haya superposición en el mismo día
        const existing = await prisma.availability.findMany({
            where: {
                professionalId: data.professionalId,
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

    async getAvailableSlots(professionalId: string, date: Date) {
        // date is a correct UTC Date; get Argentina weekday
        const arDate = toZonedTime(date, AR_TZ);
        const weekday = arDate.getDay();

        const availability = await prisma.availability.findMany({
            where: {
                professionalId,
                weekday,
                isActive: true,
            },
        });

        // Get Argentina date string for the day range
        const arDateStr = formatInTimeZone(date, AR_TZ, "yyyy-MM-dd");
        const dayStart = new Date(`${arDateStr}T00:00:00Z`);
        const dayEnd = new Date(`${arDateStr}T23:59:59Z`);

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                professionalId,
                startAt: { gte: dayStart, lte: dayEnd },
                status: { notIn: ["CANCELLED"] },
            },
            select: { startAt: true, endAt: true },
        });

        const slots: { time: string; available: boolean }[] = [];

        // Determine if the requested date is today in Argentina timezone
        const nowArStr = formatInTimeZone(new Date(), AR_TZ, "yyyy-MM-dd");
        const isToday = arDateStr === nowArStr;

        // If today, get current time in "HH:mm" format for comparison
        let currentTimeStr = "";
        if (isToday) {
            currentTimeStr = formatInTimeZone(new Date(), AR_TZ, "HH:mm");
        }

        for (const block of availability) {
            const [startH, startM] = block.startTime.split(":").map(Number);
            const [endH, endM] = block.endTime.split(":").map(Number);
            const duration = block.slotDuration;

            let currentMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            while (currentMinutes + duration <= endMinutes) {
                const h = Math.floor(currentMinutes / 60);
                const m = currentMinutes % 60;
                const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

                // Skip past time slots for today
                if (isToday && currentTimeStr && time <= currentTimeStr) {
                    currentMinutes += duration;
                    continue;
                }

                // Build a pretend-UTC date with the AR local time, then convert to real UTC
                const pretendLocal = new Date(`${arDateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
                const slotStart = fromZonedTime(pretendLocal, AR_TZ);
                const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

                const isBooked = existingAppointments.some(
                    (apt) => apt.startAt < slotEnd && apt.endAt > slotStart
                );

                slots.push({ time, available: !isBooked });
                currentMinutes += duration;
            }
        }

        return slots;
    },
};
