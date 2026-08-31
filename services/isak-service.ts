import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const isakService = {
    async getByPatient(patientId: string) {
        return prisma.isakAssessment.findMany({
            where: { patientId },
            include: {
                measuredBy: { select: { id: true, fullName: true } },
                publishedBy: { select: { id: true, fullName: true } },
            },
            orderBy: { measuredAt: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.isakAssessment.findUnique({
            where: { id },
            include: {
                measuredBy: { select: { id: true, fullName: true } },
                publishedBy: { select: { id: true, fullName: true } },
            },
        });
    },

    async create(data: Prisma.IsakAssessmentUncheckedCreateInput) {
        return prisma.isakAssessment.create({
            data,
            include: {
                measuredBy: { select: { id: true, fullName: true } },
            },
        });
    },

    async update(id: string, data: Prisma.IsakAssessmentUncheckedUpdateInput) {
        return prisma.isakAssessment.update({
            where: { id },
            data,
            include: {
                measuredBy: { select: { id: true, fullName: true } },
            },
        });
    },

    async delete(id: string) {
        return prisma.isakAssessment.delete({ where: { id } });
    },

    async publish(id: string, publishedById: string) {
        return prisma.isakAssessment.update({
            where: { id },
            data: { publishedToPatientAt: new Date(), publishedById },
        });
    },

    async revoke(id: string) {
        return prisma.isakAssessment.update({
            where: { id },
            data: { publishedToPatientAt: null, publishedById: null },
        });
    },

    async getLatest(patientId: string) {
        return prisma.isakAssessment.findFirst({
            where: { patientId },
            orderBy: { measuredAt: "desc" },
        });
    },

    async getAll() {
        return prisma.isakAssessment.findMany({
            where: { patient: { deletedAt: null } },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        gender: true,
                        birthDate: true,
                    },
                },
                measuredBy: { select: { fullName: true } },
            },
            orderBy: { measuredAt: "desc" },
        });
    },

    async getPatientsWithIsak() {
        return prisma.patient.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { isakAssessments: true } },
                isakAssessments: {
                    orderBy: { measuredAt: "desc" },
                    take: 1,
                    select: { id: true, measuredAt: true, weight: true, height: true },
                },
            },
        });
    },
};
