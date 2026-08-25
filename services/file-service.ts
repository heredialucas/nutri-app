import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export const fileService = {
    async getByPatient(patientId: string) {
        return prisma.patientFile.findMany({
            where: { patientId },
            include: {
                uploadedBy: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async create(data: {
        patientId: string;
        uploadedById?: string;
        name: string;
        url: string;
        publicId?: string;
        mimeType?: string;
        size?: number;
        category?: string;
    }) {
        return prisma.patientFile.create({ data });
    },

    async delete(id: string) {
        const file = await prisma.patientFile.findUnique({ where: { id } });
        if (file?.publicId) {
            try {
                await cloudinary.uploader.destroy(file.publicId);
            } catch {
                // Silently fail
            }
        }
        return prisma.patientFile.delete({ where: { id } });
    },

    async getById(id: string) {
        return prisma.patientFile.findUnique({ where: { id } });
    },
};
