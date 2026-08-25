import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
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

/**
 * Verifica si el usuario tiene un rol profesional (ADMIN, NUTRICIONISTA, ASISTENTE).
 */
export function isProfessionalUser(user: UserWithRoles | null): boolean {
    if (!user?.userRoles) return false;
    const professionalRoles = ["ADMIN", "PROFESSIONAL", "ASSISTANT", "RECEPTION"];
    return user.userRoles.some((ur) => professionalRoles.includes(ur.role.name));
}

/**
 * Verifica si el usuario tiene el rol PACIENTE.
 */
export function isPatientUser(user: UserWithRoles | null): boolean {
    if (!user?.userRoles) return false;
    return user.userRoles.some((ur) => ur.role.name === "PATIENT");
}

/**
 * Obtiene todos los permisos del usuario como un array de strings.
 */
export function getUserPermissions(user: UserWithRoles | null): string[] {
    if (!user?.userRoles) return [];

    const permissions = new Set<string>();
    user.userRoles.forEach((ur) => {
        ur.role.permissions.forEach((rp) => {
            permissions.add(rp.permission.action);
        });
    });
    return Array.from(permissions);
}

/**
 * Lanza error si el usuario no tiene un permiso específico.
 * Usar en Server Actions antes de ejecutar operaciones.
 */
export function requirePermission(user: UserWithRoles | null, action: string): void {
    if (!user) {
        redirect("/auth/login");
    }
    if (!hasPermission(user, action)) {
        throw new Error(`No tienes permiso para realizar esta acción: ${action}`);
    }
}

/**
 * Lanza error si el usuario no tiene acceso a un paciente específico.
 * Solo profesionales y el propio paciente pueden acceder.
 */
export function requirePatientAccess(
    user: UserWithRoles | null,
    patientUserId: string
): void {
    if (!user) {
        redirect("/auth/login");
    }

    // Si es paciente, solo puede acceder a su propio registro
    if (isPatientUser(user) && user!.id !== patientUserId) {
        throw new Error("No tienes acceso a este paciente");
    }

    // Si es profesional, necesita permiso de lectura
    if (isProfessionalUser(user) && !hasPermission(user, "patients:read")) {
        throw new Error("No tienes permiso para acceder a este paciente");
    }
}

/**
 * Lanza error si el usuario no tiene acceso profesional.
 * Redirige pacientes a su portal.
 */
export function requireProfessionalAccess(user: UserWithRoles | null): void {
    if (!user) {
        redirect("/auth/login");
    }
    if (!isProfessionalUser(user)) {
        redirect("/paciente/dashboard");
    }
}

/** Usuario autorizado para operaciones de recuperación y borrado de auditoría. */
export function isSuperAdmin(user: UserWithRoles | null): boolean {
    return user?.email?.toLowerCase() === "admin@gmail.com";
}
