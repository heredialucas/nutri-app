import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { FIRST_APPOINTMENT_STATUSES } from "@/lib/appointment-rules";

const AR_TZ = "America/Argentina/Buenos_Aires";

export const appointmentService = {
    async list(filters?: { professionalId?: string; patientId?: string; status?: string; from?: Date; to?: Date }) {
        const where: Prisma.AppointmentWhereInput = {};

        if (filters?.professionalId) where.professionalId = filters.professionalId;
        if (filters?.patientId) where.patientId = filters.patientId;
        if (filters?.status) where.status = filters.status as any;

        if (filters?.from || filters?.to) {
            where.startAt = {};
            if (filters.from) where.startAt.gte = filters.from;
            if (filters.to) where.startAt.lte = filters.to;
        }

        return prisma.appointment.findMany({
            where,
            include: {
                patient: {
                    select: { id: true, firstName: true, lastName: true, phone: true },
                },
                professional: {
                    select: { id: true, fullName: true, email: true },
                },
            },
            orderBy: { startAt: "asc" },
        });
    },

    async getById(id: string) {
        return prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                professional: { select: { id: true, fullName: true, email: true } },
            },
        });
    },

    async create(data: {
        patientId: string;
        professionalId: string;
        type: "ONLINE" | "IN_PERSON";
        startAt: Date;
        endAt: Date;
        locationId?: string | null;
        location?: string;
        meetingUrl?: string;
        notes?: string;
    }) {
        // Verificar conflictos de horario
        const conflict = await prisma.appointment.findFirst({
            where: {
                professionalId: data.professionalId,
                status: { notIn: ["CANCELLED"] },
                startAt: { lt: data.endAt },
                endAt: { gt: data.startAt },
            },
        });

        if (conflict) {
            throw new Error("Ya existe un turno en ese horario");
        }

        return prisma.appointment.create({
            data,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                professional: { select: { id: true, fullName: true } },
            },
        });
    },

    async update(id: string, data: {
        status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
        notes?: string;
        cancellationReason?: string;
        startAt?: Date;
        endAt?: Date;
        locationId?: string | null;
        location?: string;
        meetingUrl?: string;
    }) {
        if (data.startAt || data.endAt) {
            const current = await prisma.appointment.findUnique({
                where: { id },
                select: { professionalId: true, startAt: true, endAt: true, status: true },
            });
            if (!current) throw new Error("Turno no encontrado");

            const newStart = data.startAt ?? current.startAt;
            const newEnd = data.endAt ?? current.endAt;
            if (newEnd <= newStart) {
                throw new Error("El horario de fin debe ser posterior al de inicio");
            }

            if (current.status !== "CANCELLED") {
                const conflict = await prisma.appointment.findFirst({
                    where: {
                        id: { not: id },
                        professionalId: current.professionalId,
                        status: { notIn: ["CANCELLED"] },
                        startAt: { lt: newEnd },
                        endAt: { gt: newStart },
                    },
                });
                if (conflict) throw new Error("Ya existe un turno en ese horario");
            }
        }

        return prisma.appointment.update({
            where: { id },
            data,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                professional: { select: { id: true, fullName: true } },
            },
        });
    },

    async reschedule(id: string, data: {
        startAt: Date;
        endAt: Date;
        type?: "ONLINE" | "IN_PERSON";
        locationId?: string | null;
        location?: string;
        meetingUrl?: string;
        notes?: string;
    }) {
        return this.update(id, { ...data, status: "RESCHEDULED" });
    },

    async isFirstAppointment(patientId: string) {
        const count = await prisma.appointment.count({
            where: {
                patientId,
                status: { in: [...FIRST_APPOINTMENT_STATUSES] },
            },
        });
        return count === 0;
    },

    async cancel(id: string, reason?: string) {
        return prisma.appointment.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancellationReason: reason,
            },
        });
    },

    async getTodayAppointments(professionalId: string) {
        const now = new Date();
        const arDateStr = formatInTimeZone(now, AR_TZ, "yyyy-MM-dd");
        const [y, m, d] = arDateStr.split("-").map(Number);
        const todayStart = fromZonedTime(new Date(y, m - 1, d, 0, 0, 0), AR_TZ);
        const todayEnd = fromZonedTime(new Date(y, m - 1, d + 1, 0, 0, 0), AR_TZ);

        return prisma.appointment.findMany({
            where: {
                professionalId,
                startAt: { gte: todayStart, lt: todayEnd },
                status: { notIn: ["CANCELLED"] },
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
            orderBy: { startAt: "asc" },
        });
    },

    async getUpcomingCount(professionalId: string) {
        return prisma.appointment.count({
            where: {
                professionalId,
                startAt: { gte: new Date() },
                status: { in: ["PENDING", "CONFIRMED"] },
            },
        });
    },
};
