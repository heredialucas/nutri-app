import prisma from "@/lib/prisma";

const DEFAULT_PROFESSIONAL_EMAIL = "admin@mauroacosta.com";

export const professionalService = {
    async getDefaultProfessionalId(): Promise<string> {
        const admin = await prisma.user.findFirst({
            where: { email: DEFAULT_PROFESSIONAL_EMAIL, isActive: true },
            select: { id: true },
        });
        if (admin) return admin.id;

        const fallback = await prisma.user.findFirst({
            where: { isActive: true },
            select: { id: true },
            orderBy: { createdAt: "asc" },
        });
        if (!fallback) throw new Error("No hay profesionales disponibles");
        return fallback.id;
    },

    async getDefaultProfessional() {
        const id = await this.getDefaultProfessionalId();
        return prisma.user.findUnique({
            where: { id },
            select: { id: true, fullName: true, email: true },
        });
    },
};
