import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const recipeService = {
    async list(filters?: { search?: string; professionalId?: string }) {
        const where: Prisma.RecipeWhereInput = {};

        if (filters?.professionalId) where.professionalId = filters.professionalId;
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ];
        }

        return prisma.recipe.findMany({
            where,
            include: {
                professional: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.recipe.findUnique({
            where: { id },
            include: {
                professional: { select: { id: true, fullName: true } },
            },
        });
    },

    async create(data: {
        professionalId: string;
        title: string;
        description?: string;
        ingredients?: string;
        instructions?: string;
        imageUrl?: string;
    }) {
        return prisma.recipe.create({ data });
    },

    async update(id: string, data: {
        title?: string;
        description?: string;
        ingredients?: string;
        instructions?: string;
        imageUrl?: string;
    }) {
        return prisma.recipe.update({
            where: { id },
            data,
        });
    },

    async delete(id: string) {
        return prisma.recipe.delete({ where: { id } });
    },
};
