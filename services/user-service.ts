import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const userService = {
    async getUsers() {
        return await prisma.user.findMany({
            where: { isActive: true },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async createUser(data: { email: string; password?: string; firstName?: string; lastName?: string; roleIds?: string[] }) {
        // Default password if not provided
        const password = data.password || "123456";
        const hashedPassword = await bcrypt.hash(password, 10);

        return await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(), // Computed for now
                userRoles: {
                    create: data.roleIds?.map((roleId) => ({
                        role: { connect: { id: roleId } }
                    })),
                }
            },
        });
    },

    async updateUser(id: string, data: { firstName?: string; lastName?: string; roleIds?: string[] }) {
        // Start transaction to handle roles update safely
        return await prisma.$transaction(async (tx) => {
            // 1. Update basic info
            const user = await tx.user.update({
                where: { id },
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                }
            });

            // 2. Update roles if provided
            if (data.roleIds !== undefined) {
                // Delete existing roles
                await tx.userRole.deleteMany({
                    where: { userId: id }
                });

                // Create new roles
                if (data.roleIds.length > 0) {
                    await tx.userRole.createMany({
                        data: data.roleIds.map(roleId => ({
                            userId: id,
                            roleId: roleId
                        }))
                    });
                }
            }

            return user;
        });
    },

    async deleteUser(id: string) {
        return await prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    },

    async updatePassword(id: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);

        return await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }
};
