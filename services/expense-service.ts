import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const expenseService = {
    async list(filters?: { category?: string; from?: Date; to?: Date }) {
        const where: Prisma.ExpenseWhereInput = {};

        if (filters?.category) where.category = filters.category;
        if (filters?.from || filters?.to) {
            where.date = {};
            if (filters.from) where.date.gte = filters.from;
            if (filters.to) where.date.lte = filters.to;
        }

        return prisma.expense.findMany({
            where,
            orderBy: { date: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.expense.findUnique({ where: { id } });
    },

    async create(data: {
        category: string;
        description: string;
        amount: number;
        date?: Date;
        notes?: string;
    }) {
        return prisma.expense.create({ data });
    },

    async update(id: string, data: {
        category?: string;
        description?: string;
        amount?: number;
        date?: Date;
        notes?: string;
    }) {
        return prisma.expense.update({ where: { id }, data });
    },

    async delete(id: string) {
        return prisma.expense.delete({ where: { id } });
    },

    async getTotalByPeriod(from: Date, to: Date) {
        const result = await prisma.expense.aggregate({
            where: { date: { gte: from, lte: to } },
            _sum: { amount: true },
        });
        return Number(result._sum.amount ?? 0);
    },

    async getByCategory(from: Date, to: Date) {
        const expenses = await prisma.expense.findMany({
            where: { date: { gte: from, lte: to } },
        });

        const byCategory: Record<string, number> = {};
        for (const expense of expenses) {
            byCategory[expense.category] = (byCategory[expense.category] || 0) + Number(expense.amount);
        }

        return byCategory;
    },
};
