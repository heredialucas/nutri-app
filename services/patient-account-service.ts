import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { normalizeDni } from "@/lib/dni";

/**
 * Aprovisiona cuentas de paciente con la menor fricción posible.
 * El DNI es el identificador de login. La cuenta se crea con una
 * contraseña aleatoria y el paciente la define más adelante dentro
 * de la app (o la recupera cuando cargue un email).
 */
export const patientAccountService = {
    async findByDni(dni: string | null | undefined) {
        const normalized = normalizeDni(dni);
        if (!normalized) return null;
        return prisma.user.findUnique({ where: { dni: normalized } });
    },

    /**
     * Devuelve el User asociado al DNI, creándolo si no existe.
     * `created` indica si la cuenta se creó recién (para auto-login seguro).
     */
    async provisionByDni(dni: string): Promise<{
        user: {
            id: string;
            email: string | null;
            username: string | null;
            mustSetPassword: boolean;
        };
        created: boolean;
    }> {
        const normalized = normalizeDni(dni);
        if (!normalized) throw new Error("DNI inválido");

        const existing = await prisma.user.findUnique({
            where: { dni: normalized },
        });
        if (existing) {
            return {
                user: {
                    id: existing.id,
                    email: existing.email,
                    username: existing.username,
                    mustSetPassword: existing.mustSetPassword,
                },
                created: false,
            };
        }

        const password = await bcrypt.hash(randomBytes(18).toString("hex"), 10);
        const user = await prisma.user.create({
            data: { dni: normalized, password, mustSetPassword: true },
        });

        const patientRole = await prisma.role.findUnique({
            where: { name: "PATIENT" },
        });
        if (patientRole) {
            await prisma.userRole.upsert({
                where: {
                    userId_roleId: { userId: user.id, roleId: patientRole.id },
                },
                update: {},
                create: { userId: user.id, roleId: patientRole.id },
            });
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                mustSetPassword: true,
            },
            created: true,
        };
    },
};
