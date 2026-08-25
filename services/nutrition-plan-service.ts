import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const nutritionPlanService = {
    async list(filters?: { patientId?: string; professionalId?: string; status?: string }) {
        const where: Prisma.NutritionPlanWhereInput = {};

        if (filters?.patientId) where.patientId = filters.patientId;
        if (filters?.professionalId) where.professionalId = filters.professionalId;
        if (filters?.status) where.status = filters.status;

        return prisma.nutritionPlan.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                professional: { select: { id: true, fullName: true } },
                days: {
                    include: {
                        meals: {
                            include: { foods: true },
                            orderBy: { mealOrder: "asc" },
                        },
                    },
                    orderBy: { dayOrder: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.nutritionPlan.findUnique({
            where: { id },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                professional: { select: { id: true, fullName: true } },
                days: {
                    include: {
                        meals: {
                            include: { foods: true },
                            orderBy: { mealOrder: "asc" },
                        },
                    },
                    orderBy: { dayOrder: "asc" },
                },
            },
        });
    },

    async create(data: {
        patientId: string;
        professionalId: string;
        title: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        calorieTarget?: number;
        notes?: string;
        days?: {
            dayOrder: number;
            label: string;
            meals: {
                label: string;
                mealOrder: number;
                foods: { name: string; quantity?: string; unit?: string; notes?: string }[];
            }[];
        }[];
    }) {
        const { days, ...planData } = data;

        return prisma.nutritionPlan.create({
            data: {
                ...planData,
                days: days
                    ? {
                        create: days.map((day) => ({
                            dayOrder: day.dayOrder,
                            label: day.label,
                            meals: {
                                create: day.meals.map((meal) => ({
                                    label: meal.label,
                                    mealOrder: meal.mealOrder,
                                    foods: {
                                        create: meal.foods.map((food) => ({
                                            name: food.name,
                                            quantity: food.quantity,
                                            unit: food.unit,
                                            notes: food.notes,
                                        })),
                                    },
                                })),
                            },
                        })),
                    }
                    : undefined,
            },
            include: {
                days: {
                    include: {
                        meals: { include: { foods: true } },
                    },
                },
            },
        });
    },

    async update(id: string, data: {
        title?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string;
        calorieTarget?: number;
        notes?: string;
        pdfUrl?: string;
    }) {
        return prisma.nutritionPlan.update({
            where: { id },
            data,
        });
    },

    async delete(id: string) {
        return prisma.nutritionPlan.delete({ where: { id } });
    },

    async setActive(id: string, patientId: string) {
        // Desactivar planes anteriores del mismo paciente
        await prisma.nutritionPlan.updateMany({
            where: {
                patientId,
                status: "ACTIVE",
                id: { not: id },
            },
            data: { status: "ARCHIVED" },
        });

        return prisma.nutritionPlan.update({
            where: { id },
            data: { status: "ACTIVE" },
        });
    },

    async getActiveForPatient(patientId: string) {
        return prisma.nutritionPlan.findFirst({
            where: { patientId, status: "ACTIVE" },
            include: {
                days: {
                    include: {
                        meals: {
                            include: { foods: true },
                            orderBy: { mealOrder: "asc" },
                        },
                    },
                    orderBy: { dayOrder: "asc" },
                },
            },
        });
    },

    async duplicate(id: string, professionalId: string) {
        const original = await this.getById(id);
        if (!original) throw new Error("Plan no encontrado");

        const newPlan = await this.create({
            patientId: original.patientId,
            professionalId,
            title: `${original.title} (copia)`,
            description: original.description ?? undefined,
            calorieTarget: original.calorieTarget ?? undefined,
            notes: original.notes ?? undefined,
            days: original.days.map((day) => ({
                dayOrder: day.dayOrder,
                label: day.label,
                meals: day.meals.map((meal) => ({
                    label: meal.label,
                    mealOrder: meal.mealOrder,
                    foods: meal.foods.map((food) => ({
                        name: food.name,
                        quantity: food.quantity ?? undefined,
                        unit: food.unit ?? undefined,
                        notes: food.notes ?? undefined,
                    })),
                })),
            })),
        });

        // Set status to DRAFT after creation
        return this.update(newPlan.id, { status: "DRAFT" });
    },
};
