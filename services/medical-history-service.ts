import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const medicalHistoryService = {
    async getByPatientId(patientId: string) {
        return prisma.medicalHistory.findUnique({
            where: { patientId },
            include: {
                patient: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    },

    async upsert(patientId: string, data: {
        familyHistory?: string;
        personalHistory?: string;
        surgeries?: string;
        diagnoses?: string;
        habits?: string;
        sleepHours?: string;
        physicalActivity?: string;
        digestiveSymptoms?: string;
        observations?: string;
    }) {
        return prisma.medicalHistory.upsert({
            where: { patientId },
            create: { patientId, ...data },
            update: data,
        });
    },

    async getPatientAllergies(patientId: string) {
        return prisma.allergy.findMany({
            where: { patientId },
            orderBy: { name: "asc" },
        });
    },

    async addAllergy(patientId: string, data: { name: string; reaction?: string; severity?: string; notes?: string }) {
        return prisma.allergy.create({
            data: { patientId, ...data },
        });
    },

    async updateAllergy(id: string, data: { name?: string; reaction?: string; severity?: string; notes?: string }) {
        return prisma.allergy.update({
            where: { id },
            data,
        });
    },

    async deleteAllergy(id: string) {
        return prisma.allergy.delete({ where: { id } });
    },

    async getPatientMedications(patientId: string) {
        return prisma.medication.findMany({
            where: { patientId },
            orderBy: { name: "asc" },
        });
    },

    async addMedication(patientId: string, data: {
        name: string;
        dosage?: string;
        frequency?: string;
        indication?: string;
        startDate?: Date;
        endDate?: Date;
        notes?: string;
    }) {
        return prisma.medication.create({
            data: { patientId, ...data },
        });
    },

    async updateMedication(id: string, data: {
        name?: string;
        dosage?: string;
        frequency?: string;
        indication?: string;
        startDate?: Date;
        endDate?: Date;
        notes?: string;
    }) {
        return prisma.medication.update({
            where: { id },
            data,
        });
    },

    async deleteMedication(id: string) {
        return prisma.medication.delete({ where: { id } });
    },

    async getPatientGoals(patientId: string) {
        return prisma.patientGoal.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" },
        });
    },

    async addGoal(patientId: string, data: {
        type: string;
        description?: string;
        targetValue?: string;
        targetDate?: Date;
    }) {
        return prisma.patientGoal.create({
            data: { patientId, ...data },
        });
    },

    async updateGoal(id: string, data: {
        type?: string;
        description?: string;
        targetValue?: string;
        targetDate?: Date;
        status?: string;
        completedAt?: Date;
    }) {
        return prisma.patientGoal.update({
            where: { id },
            data,
        });
    },

    async deleteGoal(id: string) {
        return prisma.patientGoal.delete({ where: { id } });
    },
};
