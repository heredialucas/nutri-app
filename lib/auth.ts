import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { authService } from "@/services/auth-service";

// Tipo inferido de Prisma para usuario con roles y permisos
export type UserWithRoles = Prisma.UserGetPayload<{
    include: {
        userRoles: {
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true };
                        };
                    };
                };
            };
        };
    };
}>;

export async function getSession() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken?.value) return null;

    try {
        const payload = await authService.verifySession(sessionToken.value);
        if (!payload) return null;

        return { user: { id: payload.userId as string, email: payload.email as string } };
    } catch {
        return null;
    }
}

/**
 * Obtiene el usuario actual con sus roles y permisos.
 * Usa React.cache() para deduplicar llamadas a DB dentro del mismo request.
 */
export const getCurrentUser = cache(async (): Promise<UserWithRoles | null> => {
    const session = await getSession();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return user;
});

/**
 * Verifica si un usuario tiene un permiso específico.
 * Tipado correctamente con los tipos generados por Prisma.
 */
export function hasPermission(user: UserWithRoles | null, action: string): boolean {
    if (!user?.userRoles) return false;

    return user.userRoles.some((ur) =>
        ur.role.permissions.some((rp) => rp.permission.action === action)
    );
}

/**
 * Verifica si un usuario tiene el rol ADMIN.
 */
export function isAdminUser(user: UserWithRoles | null): boolean {
    if (!user?.userRoles) return false;
    return user.userRoles.some((ur) => ur.role.name === "ADMIN");
}

/** Usuario autorizado para operaciones de recuperación y borrado de auditoría. */
export function isSuperAdmin(user: UserWithRoles | null): boolean {
    return user?.email?.toLowerCase() === "admin@gmail.com";
}
