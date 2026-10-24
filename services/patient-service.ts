import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const patientInclude = {
    medicalHistory: true,
    anamnesis: true,
    allergies: true,
    medications: true,
    goals: { where: { status: "ACTIVE" } },
    _count: {
        select: {
            appointments: true,
            measurements: true,
            nutritionPlans: true,
            followUps: true,
            files: true,
            consents: true,
        },
    },
} satisfies Prisma.PatientInclude;

export const patientService = {
    async list(filters?: { search?: string; status?: string; trashed?: boolean }) {
        const where: Prisma.PatientWhereInput = {};

        // Por defecto excluye eliminados; con trashed:true devuelve solo eliminados
        if (filters?.trashed) {
            where.deletedAt = { not: null };
        } else {
            where.deletedAt = null;
        }

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
        const patient = await prisma.patient.findUnique({ where: { id } });
        const updated = await prisma.patient.update({
            where: { id },
            data: { status: "ARCHIVED", deletedAt: new Date() },
        });

        // Desactivar la cuenta de usuario vinculada para que no pueda iniciar sesión
        if (patient?.userId) {
            await prisma.user.update({
                where: { id: patient.userId },
                data: { isActive: false },
            });
        }

        return updated;
    },

    async reactivate(id: string) {
        const patient = await prisma.patient.findUnique({ where: { id } });
        const updated = await prisma.patient.update({
            where: { id },
            data: { status: "ACTIVE", deletedAt: null },
        });

        // Reactivar la cuenta de usuario vinculada
        if (patient?.userId) {
            await prisma.user.update({
                where: { id: patient.userId },
                data: { isActive: true },
            });
        }

        return updated;
    },

    // Soft delete: only marks deletedAt so clinical data and statistics remain usable
    async softDelete(id: string) {
        const patient = await prisma.patient.findUnique({ where: { id } });
        const updated = await prisma.patient.update({
            where: { id },
            data: { deletedAt: new Date(), status: "ARCHIVED" },
        });

        // Desactivar la cuenta de usuario vinculada para que no pueda iniciar sesión
        if (patient?.userId) {
            await prisma.user.update({
                where: { id: patient.userId },
                data: { isActive: false },
            });
        }

        return updated;
    },

    async getActiveCount() {
        return prisma.patient.count({ where: { status: "ACTIVE", deletedAt: null } });
    },

    async getByUserId(userId: string) {
        const direct = await prisma.patient.findFirst({
            where: {
                userId,
                deletedAt: null,
            },
            include: patientInclude,
        });
        if (direct) return direct;

        // Auto-vincular ficha existente por DNI o email si la cuenta no estaba conectada
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                dni: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!user) return null;

        if (user.dni) {
            const byDni = await prisma.patient.findUnique({
                where: { documentNumber: user.dni },
            });
            if (byDni) {
                return prisma.patient.update({
                    where: { id: byDni.id },
                    data: { userId: user.id, deletedAt: null },
                    include: patientInclude,
                });
            }
        }

        if (user.email) {
            const byEmail = await prisma.patient.findFirst({
                where: { email: user.email, userId: null, deletedAt: null },
            });
            if (byEmail) {
                return prisma.patient.update({
                    where: { id: byEmail.id },
                    data: {
                        userId: user.id,
                        documentNumber: byEmail.documentNumber || user.dni || undefined,
                    },
                    include: patientInclude,
                });
            }
        }

        return null;
    },
};
