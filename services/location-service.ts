import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const locationService = {
    async list() {
        return prisma.location.findMany({
            orderBy: { name: "asc" },
        });
    },

    async listActive() {
        return prisma.location.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        });
    },

    async getById(id: string) {
        return prisma.location.findUnique({ where: { id } });
    },

    async create(data: { name: string; address: string }) {
        const name = data.name?.trim();
        const address = data.address?.trim();

        if (!name) throw new Error("El nombre de la sede es obligatorio");
        if (!address) throw new Error("La dirección de la sede es obligatoria");

        return prisma.location.create({ data: { name, address } });
    },

    async update(id: string, data: { name?: string; address?: string; isActive?: boolean }) {
        const updateData: Prisma.LocationUpdateInput = {};

        if (data.name !== undefined) {
            const name = data.name.trim();
            if (!name) throw new Error("El nombre de la sede es obligatorio");
            updateData.name = name;
        }
        if (data.address !== undefined) {
            const address = data.address.trim();
            if (!address) throw new Error("La dirección de la sede es obligatoria");
            updateData.address = address;
        }
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        return prisma.location.update({ where: { id }, data: updateData });
    },

    async remove(id: string) {
        const [appointments, availability] = await Promise.all([
            prisma.appointment.count({ where: { locationId: id } }),
            prisma.availability.count({ where: { locationId: id } }),
        ]);

        if (appointments > 0 || availability > 0) {
            throw new Error(
                "No se puede eliminar una sede con turnos o disponibilidad asociada. Desactivala en su lugar.",
            );
        }

        return prisma.location.delete({ where: { id } });
    },
};
