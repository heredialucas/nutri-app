import prisma from "@/lib/prisma";

export const waitlistService = {
    async list() {
        return prisma.waitlistEntry.findMany({
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
            orderBy: { createdAt: "asc" },
        });
    },

    async add(patientId: string) {
        // Verificar que no esté ya en la lista
        const existing = await prisma.waitlistEntry.findFirst({
            where: { patientId },
        });

        if (existing) {
            throw new Error("El paciente ya está en la lista de espera");
        }

        return prisma.waitlistEntry.create({
            data: { patientId },
        });
    },

    async remove(patientId: string) {
        return prisma.waitlistEntry.deleteMany({
            where: { patientId },
        });
    },

    async isInWaitlist(patientId: string) {
        const entry = await prisma.waitlistEntry.findFirst({
            where: { patientId },
        });
        return !!entry;
    },

    async getCount() {
        return prisma.waitlistEntry.count();
    },
};
