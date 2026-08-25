import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
        const weekday = date.getDay();

        const availability = await prisma.availability.findMany({
            where: {
                professionalId,
                weekday,
                isActive: true,
            },
        });

        // Obtener turnos existentes para esa fecha
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                professionalId,
                startAt: { gte: dayStart, lte: dayEnd },
                status: { notIn: ["CANCELLED"] },
            },
            select: { startAt: true, endAt: true },
        });

        const slots: { time: string; available: boolean }[] = [];

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

                const slotStart = new Date(date);
                slotStart.setHours(h, m, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + duration);

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
