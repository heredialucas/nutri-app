import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export const progressService = {
    async getByPatient(patientId: string) {
        return prisma.progressPhoto.findMany({
            where: { patientId },
            include: {
                uploadedBy: { select: { id: true, fullName: true } },
            },
            orderBy: { takenAt: "desc" },
        });
    },

    async create(data: {
        patientId: string;
        uploadedById?: string;
        url: string;
        publicId: string;
        type: string;
        takenAt?: Date;
        consentGranted?: boolean;
    }) {
        return prisma.progressPhoto.create({ data });
    },

    async delete(id: string) {
        const photo = await prisma.progressPhoto.findUnique({ where: { id } });
        if (photo?.publicId) {
            try {
                await cloudinary.uploader.destroy(photo.publicId);
            } catch {
                // Silently fail if cloudinary delete fails
            }
        }
        return prisma.progressPhoto.delete({ where: { id } });
    },

    async getGroupedByType(patientId: string) {
        const photos = await prisma.progressPhoto.findMany({
            where: { patientId },
            orderBy: { takenAt: "desc" },
        });

        const grouped: Record<string, typeof photos> = {};
        for (const photo of photos) {
            if (!grouped[photo.type]) grouped[photo.type] = [];
            grouped[photo.type].push(photo);
        }

        return grouped;
    },
};
