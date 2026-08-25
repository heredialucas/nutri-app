import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const patientInclude = {
    medicalHistory: true,
    allergies: true,
    medications: true,
    goals: { where: { status: "ACTIVE" } },
    _count: {
        select: {
            appointments: true,
            measurements: true,
            nutritionPlans: true,
            followUps: true,
        },
    },
} satisfies Prisma.PatientInclude;

export const patientService = {
    async list(filters?: { search?: string; status?: string }) {
        const where: Prisma.PatientWhereInput = {
            deletedAt: null,
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: "insensitive" } },
                { lastName: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
                { phone: { contains: filters.search, mode: "insensitive" } },
                { documentNumber: { contains: filters.search, mode: "insensitive" } },
            ];
        }

        return prisma.patient.findMany({
            where,
            include: patientInclude,
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.patient.findUnique({
            where: { id },
            include: patientInclude,
        });
    },

    async create(data: Prisma.PatientCreateInput) {
        return prisma.patient.create({
            data,
            include: patientInclude,
        });
    },

    async update(id: string, data: Prisma.PatientUpdateInput) {
        return prisma.patient.update({
            where: { id },
            data,
            include: patientInclude,
        });
    },

    async archive(id: string) {
        return prisma.patient.update({
            where: { id },
            data: { status: "ARCHIVED", deletedAt: new Date() },
        });
    },

    async reactivate(id: string) {
        return prisma.patient.update({
            where: { id },
            data: { status: "ACTIVE", deletedAt: null },
        });
    },

    async getActiveCount() {
        return prisma.patient.count({ where: { status: "ACTIVE", deletedAt: null } });
    },

    async getByUserId(userId: string) {
        // Buscar paciente vinculado a un usuario del portal
        // Por ahora busca por email del usuario
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        return prisma.patient.findFirst({
            where: {
                OR: [
                    { email: user.email },
                ],
                deletedAt: null,
            },
            include: patientInclude,
        });
    },
};
