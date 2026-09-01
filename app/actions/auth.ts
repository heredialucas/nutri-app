"use server";

import { authService } from "@/services/auth-service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function loginAction(formData: FormData) {
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
        return { error: "Faltan datos" };
    }

    try {
        const { user: loginResult, token } = await authService.login(identifier, password);

        const cookieStore = await cookies();
        cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        // Fetch roles to determine redirect
        const userWithRoles = await prisma.user.findUnique({
            where: { id: loginResult.id },
            include: {
                userRoles: {
                    include: { role: true },
                },
            },
        });

        const isPatient = userWithRoles?.userRoles.some((ur) => ur.role.name === "PATIENT");
        const redirectTo = isPatient ? "/paciente/dashboard" : "/dashboard";

        return { success: true, redirectTo };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error al iniciar sesión" };
    }
}

export async function registerAction(data: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}) {
    const { email, password, username, firstName, lastName } = data;

    if (!email || !password) {
        return { error: "Faltan datos" };
    }

    try {
        const user = await authService.register(email, password, username);

        // Update user with firstName/lastName if provided
        if (firstName || lastName) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
                },
            });
        }

        // Assign PATIENT role
        const patientRole = await prisma.role.findUnique({ where: { name: "PATIENT" } });
        if (patientRole) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId: patientRole.id } },
                update: {},
                create: { userId: user.id, roleId: patientRole.id },
            });
        }

        // Create Patient record linked to User
        const existingPatient = await prisma.patient.findFirst({
            where: { email: email.trim(), deletedAt: null },
        });

        if (existingPatient) {
            // Link existing patient to this user
            await prisma.patient.update({
                where: { id: existingPatient.id },
                data: { userId: user.id },
            });
        } else {
            await prisma.patient.create({
                data: {
                    userId: user.id,
                    firstName: (firstName || "").trim() || "Sin nombre",
                    lastName: (lastName || "").trim() || "Sin apellido",
                    email: email.trim(),
                    billingType: "particular",
                },
            });
        }

        // Auto-login
        const { token } = await authService.login(email, password);

        const cookieStore = await cookies();
        cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return { success: true, redirectTo: "/paciente/dashboard" };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error al registrarse" };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
    redirect("/auth/login");
}

export async function forgotPasswordAction(email: string) {
    if (!email) return { error: "Email requerido" };
    try {
        await authService.requestPasswordReset(email);
        return { success: true };
    } catch (error) {
        return { error: "Error al solicitar restablecimiento" };
    }
}

export async function updatePasswordAction(password: string, resetToken?: string) {
    if (!password) return { error: "Contraseña requerida" };

    if (resetToken) {
        try {
            await authService.resetPassword(resetToken, password);
            return { success: true };
        } catch (error) {
            return { error: error instanceof Error ? error.message : "El enlace no es válido o venció" };
        }
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token");
    if (!token) return { error: "No autorizado" };

    const session = await authService.verifySession(token.value);
    if (!session?.userId) return { error: "No autorizado" };

    try {
        await authService.updatePassword(password, session.userId as string);
        return { success: true };
    } catch (error) {
        return { error: "Error al actualizar contraseña" };
    }
}
