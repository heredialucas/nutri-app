import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const paymentService = {
    async list(filters?: { patientId?: string; from?: Date; to?: Date; method?: string }) {
        const where: Prisma.PaymentWhereInput = {};

        if (filters?.patientId) where.patientId = filters.patientId;
        if (filters?.method) where.method = filters.method;
        if (filters?.from || filters?.to) {
            where.date = {};
            if (filters.from) where.date.gte = filters.from;
            if (filters.to) where.date.lte = filters.to;
        }

        return prisma.payment.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { date: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.payment.findUnique({
            where: { id },
            include: { patient: true },
        });
    },

    async create(data: {
        patientId: string;
        amount: number;
        method: string;
        description?: string;
        date?: Date;
        notes?: string;
    }) {
        return prisma.payment.create({ data });
    },

    async update(id: string, data: {
        amount?: number;
        method?: string;
        description?: string;
        date?: Date;
        notes?: string;
    }) {
        return prisma.payment.update({ where: { id }, data });
    },

    async delete(id: string) {
        return prisma.payment.delete({ where: { id } });
    },

    async getTotalByPatient(patientId: string) {
        const result = await prisma.payment.aggregate({
            where: { patientId },
            _sum: { amount: true },
        });
        return Number(result._sum.amount ?? 0);
    },

    async getTotalByPeriod(from: Date, to: Date) {
        const result = await prisma.payment.aggregate({
            where: { date: { gte: from, lte: to } },
            _sum: { amount: true },
        });
        return Number(result._sum.amount ?? 0);
    },
};
