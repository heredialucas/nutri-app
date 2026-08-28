import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const planInclude = {
    professional: { select: { id: true, fullName: true } },
    patients: {
        include: { patient: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { assignedAt: "asc" as const },
    },
    recipes: true,
    supplements: true,
    days: {
        include: {
            meals: {
                include: { foods: true },
                orderBy: { mealOrder: "asc" },
            },
        },
        orderBy: { dayOrder: "asc" },
    },
} satisfies Prisma.NutritionPlanInclude;

export const nutritionPlanService = {
    async list(filters?: { patientId?: string; professionalId?: string; status?: string }) {
        const where: Prisma.NutritionPlanWhereInput = {};

        if (filters?.patientId) where.patients = { some: { patientId: filters.patientId } };
        if (filters?.professionalId) where.professionalId = filters.professionalId;
        if (filters?.status) where.status = filters.status;

        return prisma.nutritionPlan.findMany({
            where,
            include: planInclude,
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.nutritionPlan.findUnique({
            where: { id },
            include: planInclude,
        });
    },

    async create(data: {
        professionalId: string;
        title: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        calorieTarget?: number;
        proteinTarget?: number;
        carbTarget?: number;
        fatTarget?: number;
        notes?: string;
        tips?: string;
        patientIds?: string[];
        supplements?: {
            name: string;
            dosage?: string;
            timing?: string;
            frequency?: string;
            notes?: string;
        }[];
        days?: {
            dayOrder: number;
            label: string;
            meals: {
                label: string;
                mealOrder: number;
                notes?: string;
                foods: {
                    name: string;
                    quantity?: string;
                    unit?: string;
                    notes?: string;
                    calories?: number;
                    protein?: number;
                    carbs?: number;
                    fat?: number;
                }[];
            }[];
        }[];
    }) {
        const { days, supplements, patientIds, ...planData } = data;

        return prisma.nutritionPlan.create({
            data: {
                ...planData,
                patients: patientIds && patientIds.length > 0
                    ? { create: patientIds.map((patientId) => ({ patientId })) }
                    : undefined,
                supplements: supplements
                    ? {
                        create: supplements.map((s) => ({
                            name: s.name,
                            dosage: s.dosage,
                            timing: s.timing,
                            frequency: s.frequency,
                            notes: s.notes,
                        })),
                    }
                    : undefined,
                days: days
                    ? {
                        create: days.map((day) => ({
                            dayOrder: day.dayOrder,
                            label: day.label,
                            meals: {
                                create: day.meals.map((meal) => ({
                                    label: meal.label,
                                    mealOrder: meal.mealOrder,
                                    notes: meal.notes,
                                    foods: {
                                        create: meal.foods.map((food) => ({
                                            name: food.name,
                                            quantity: food.quantity,
                                            unit: food.unit,
                                            notes: food.notes,
                                            calories: food.calories,
                                            protein: food.protein,
                                            carbs: food.carbs,
                                            fat: food.fat,
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
        proteinTarget?: number;
        carbTarget?: number;
        fatTarget?: number;
        notes?: string;
        tips?: string;
        pdfUrl?: string;
        patientIds?: string[];
        supplements?: {
            name: string;
            dosage?: string;
            timing?: string;
            frequency?: string;
            notes?: string;
        }[];
        days?: {
            dayOrder: number;
            label: string;
            meals: {
                label: string;
                mealOrder: number;
                notes?: string;
                foods: {
                    name: string;
                    quantity?: string;
                    unit?: string;
                    notes?: string;
                    calories?: number;
                    protein?: number;
                    carbs?: number;
                    fat?: number;
                }[];
            }[];
        }[];
    }) {
        const { days, supplements, patientIds, ...planData } = data;

        return prisma.nutritionPlan.update({
            where: { id },
            data: {
                ...planData,
                ...(patientIds
                    ? {
                        patients: {
                            deleteMany: {},
                            create: patientIds.map((patientId) => ({ patientId })),
                        },
                    }
                    : undefined),
                ...(supplements
                    ? {
                        supplements: {
                            deleteMany: {},
                            create: supplements.map((s) => ({
                                name: s.name,
                                dosage: s.dosage,
                                timing: s.timing,
                                frequency: s.frequency,
                                notes: s.notes,
                            })),
                        },
                    }
                    : undefined),
                ...(days
                    ? {
                        days: {
                            deleteMany: {},
                            create: days.map((day) => ({
                                dayOrder: day.dayOrder,
                                label: day.label,
                                meals: {
                                    create: day.meals.map((meal) => ({
                                        label: meal.label,
                                        mealOrder: meal.mealOrder,
                                        notes: meal.notes,
                                        foods: {
                                            create: meal.foods.map((food) => ({
                                                name: food.name,
                                                quantity: food.quantity,
                                                unit: food.unit,
                                                notes: food.notes,
                                                calories: food.calories,
                                                protein: food.protein,
                                                carbs: food.carbs,
                                                fat: food.fat,
                                            })),
                                        },
                                    })),
                                },
                            })),
                        },
                    }
                    : undefined),
            },
        });
    },

    async assignPatients(id: string, patientIds: string[]) {
        const uniqueIds = Array.from(new Set(patientIds.filter(Boolean)));
        return prisma.$transaction([
            prisma.nutritionPlanPatient.deleteMany({ where: { planId: id } }),
            ...(uniqueIds.length > 0
                ? [
                    prisma.nutritionPlanPatient.createMany({
                        data: uniqueIds.map((patientId) => ({ planId: id, patientId })),
                    }),
                ]
                : []),
        ]);
    },

    async getActiveForPatient(patientId: string) {
        return prisma.nutritionPlan.findFirst({
            where: { status: "ACTIVE", patients: { some: { patientId } } },
            include: planInclude,
        });
    },

    async listForPatient(patientId: string) {
        return prisma.nutritionPlan.findMany({
            where: { patients: { some: { patientId } } },
            include: planInclude,
            orderBy: { createdAt: "desc" },
        });
    },

    async delete(id: string) {
        return prisma.nutritionPlan.delete({ where: { id } });
    },

    async setActive(id: string, patientId: string) {
        // Asegurar que el paciente esté asignado al plan
        await prisma.nutritionPlanPatient.upsert({
            where: { planId_patientId: { planId: id, patientId } },
            create: { planId: id, patientId },
            update: {},
        });

        // Desactivar planes activos anteriores del mismo paciente
        await prisma.nutritionPlan.updateMany({
            where: {
                status: "ACTIVE",
                patients: { some: { patientId } },
                id: { not: id },
            },
            data: { status: "ARCHIVED" },
        });

        return prisma.nutritionPlan.update({
            where: { id },
            data: { status: "ACTIVE" },
        });
    },

    async duplicate(id: string, professionalId: string) {
        const original = await this.getById(id);
        if (!original) throw new Error("Plan no encontrado");

        const newPlan = await this.create({
            professionalId,
            title: `${original.title} (copia)`,
            description: original.description ?? undefined,
            calorieTarget: original.calorieTarget ?? undefined,
            proteinTarget: original.proteinTarget ?? undefined,
            carbTarget: original.carbTarget ?? undefined,
            fatTarget: original.fatTarget ?? undefined,
            notes: original.notes ?? undefined,
            tips: original.tips ?? undefined,
            patientIds: original.patients?.map((p) => p.patientId) ?? [],
            supplements: (original.supplements || []).map((s) => ({
                name: s.name,
                dosage: s.dosage ?? undefined,
                timing: s.timing ?? undefined,
                frequency: s.frequency ?? undefined,
                notes: s.notes ?? undefined,
            })),
            days: original.days.map((day) => ({
                dayOrder: day.dayOrder,
                label: day.label,
                meals: day.meals.map((meal) => ({
                    label: meal.label,
                    mealOrder: meal.mealOrder,
                    notes: meal.notes ?? undefined,
                    foods: meal.foods.map((food) => ({
                        name: food.name,
                        quantity: food.quantity ?? undefined,
                        unit: food.unit ?? undefined,
                        notes: food.notes ?? undefined,
                        calories: food.calories ?? undefined,
                        protein: food.protein ? Number(food.protein) : undefined,
                        carbs: food.carbs ? Number(food.carbs) : undefined,
                        fat: food.fat ? Number(food.fat) : undefined,
                    })),
                })),
            })),
        });

        return this.update(newPlan.id, { status: "DRAFT" });
    },
};
