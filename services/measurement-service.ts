import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const measurementService = {
    async getByPatient(patientId: string) {
        return prisma.anthropometricMeasurement.findMany({
            where: { patientId },
            include: {
                measuredBy: { select: { id: true, fullName: true } },
            },
            orderBy: { measuredAt: "desc" },
        });
    },

    async create(data: {
        patientId: string;
        measuredById?: string;
        appointmentId?: string;
        weight?: number;
        height?: number;
        waist?: number;
        hip?: number;
        arm?: number;
        bodyFatPercentage?: number;
        muscleMass?: number;
        notes?: string;
        measuredAt?: Date;
    }) {
        // Calcular BMI si hay peso y altura
        let bmi: number | undefined;
        if (data.weight && data.height) {
            const heightM = data.height / 100;
            bmi = Math.round((data.weight / (heightM * heightM)) * 100) / 100;
        }

        return prisma.anthropometricMeasurement.create({
            data: {
                ...data,
                bmi,
                weight: data.weight ?? undefined,
                height: data.height ?? undefined,
                waist: data.waist ?? undefined,
                hip: data.hip ?? undefined,
                arm: data.arm ?? undefined,
                bodyFatPercentage: data.bodyFatPercentage ?? undefined,
                muscleMass: data.muscleMass ?? undefined,
            },
            include: {
                measuredBy: { select: { id: true, fullName: true } },
            },
        });
    },

    async update(id: string, data: {
        weight?: number;
        height?: number;
        waist?: number;
        hip?: number;
        arm?: number;
        bodyFatPercentage?: number;
        muscleMass?: number;
        notes?: string;
    }) {
        // Recalcular BMI si cambia peso o altura
        const existing = await prisma.anthropometricMeasurement.findUnique({ where: { id } });
        let bmi: number | undefined;
        const newWeight = data.weight ?? (existing?.weight ? Number(existing.weight) : undefined);
        const newHeight = data.height ?? (existing?.height ? Number(existing.height) : undefined);
        if (newWeight && newHeight) {
            const heightM = newHeight / 100;
            bmi = Math.round((newWeight / (heightM * heightM)) * 100) / 100;
        }

        return prisma.anthropometricMeasurement.update({
            where: { id },
            data: { ...data, ...(bmi !== undefined ? { bmi } : {}) },
        });
    },

    async delete(id: string) {
        return prisma.anthropometricMeasurement.delete({ where: { id } });
    },

    async getLatest(patientId: string) {
        return prisma.anthropometricMeasurement.findFirst({
            where: { patientId },
            orderBy: { measuredAt: "desc" },
        });
    },

    async getEvolutionData(patientId: string, limit?: number) {
        const measurements = await prisma.anthropometricMeasurement.findMany({
            where: { patientId },
            orderBy: { measuredAt: "asc" },
            take: limit,
        });

        return measurements.map((m) => ({
            date: m.measuredAt,
            weight: m.weight ? Number(m.weight) : null,
            bmi: m.bmi ? Number(m.bmi) : null,
            waist: m.waist ? Number(m.waist) : null,
            bodyFat: m.bodyFatPercentage ? Number(m.bodyFatPercentage) : null,
            muscleMass: m.muscleMass ? Number(m.muscleMass) : null,
        }));
    },
};
