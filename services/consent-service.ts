import prisma from "@/lib/prisma";

export const consentService = {
    async getByPatient(patientId: string) {
        return prisma.consent.findMany({
            where: { patientId },
            orderBy: { signedAt: "desc" },
        });
    },

    async create(data: {
        patientId: string;
        type: string;
        version?: string;
        signature?: string;
        ipAddress?: string;
        documentUrl?: string;
    }) {
        return prisma.consent.create({ data });
    },

    async getById(id: string) {
        return prisma.consent.findUnique({ where: { id } });
    },

    async hasActiveConsent(patientId: string, type: string) {
        const consent = await prisma.consent.findFirst({
            where: { patientId, type },
            orderBy: { signedAt: "desc" },
        });
        return !!consent;
    },

    async delete(id: string) {
        return prisma.consent.delete({ where: { id } });
    },
};
