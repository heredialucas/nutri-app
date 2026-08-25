import prisma from "@/lib/prisma";

export const followupService = {
    async getAll() {
        return prisma.followUp.findMany({
            include: {
                patient: {
                    select: { id: true, firstName: true, lastName: true, status: true },
                },
            },
            orderBy: { weekStart: "desc" },
        });
    },

    async getByPatient(patientId: string) {
        return prisma.followUp.findMany({
            where: { patientId },
            orderBy: { weekStart: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.followUp.findUnique({ where: { id } });
    },

    async create(data: {
        patientId: string;
        weekStart: Date;
        weight?: number;
        adherence?: string;
        hunger?: string;
        energy?: string;
        difficulties?: string;
        patientNotes?: string;
        proNotes?: string;
    }) {
        return prisma.followUp.create({ data });
    },

    async update(id: string, data: {
        weight?: number;
        adherence?: string;
        hunger?: string;
        energy?: string;
        difficulties?: string;
        patientNotes?: string;
        proNotes?: string;
    }) {
        return prisma.followUp.update({ where: { id }, data });
    },

    async delete(id: string) {
        return prisma.followUp.delete({ where: { id } });
    },

    async getLatest(patientId: string) {
        return prisma.followUp.findFirst({
            where: { patientId },
            orderBy: { weekStart: "desc" },
        });
    },
};
