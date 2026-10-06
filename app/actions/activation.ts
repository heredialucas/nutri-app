"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { normalizeDni, isValidDni } from "@/lib/dni";
import { authService } from "@/services/auth-service";
import { verificationService } from "@/services/verification-service";

const ACTIVATION_COOKIE = "activation_token";
const SESSION_COOKIE = "session_token";
const COOKIE_BASE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
};

function maskEmail(email: string): string {
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const visible = user.slice(0, 1);
    return `${visible}${"*".repeat(Math.max(user.length - 1, 1))}@${domain}`;
}

function isValidEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

async function findByDni(dni: string) {
    const [patient, user] = await Promise.all([
        prisma.patient.findUnique({ where: { documentNumber: dni } }),
        prisma.user.findUnique({ where: { dni } }),
    ]);
    return { patient, user };
}

async function setSession(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const token = await authService.issueToken(user);
    (await cookies()).set(SESSION_COOKIE, token, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24 * 7,
    });
}

/**
 * Datos de una ficha/cuenta por DNI para precargar el registro.
 * No devuelve el email completo (solo enmascarado).
 */
export async function lookupAccountByDni(dni: string) {
    const normalized = normalizeDni(dni);
    if (!isValidDni(normalized)) {
        return { found: false as const };
    }

    const { patient, user } = await findByDni(normalized);
    if (!patient && !user) {
        return { found: false as const };
    }

    const email = user?.email || patient?.email || null;

    return {
        found: true as const,
        hasUser: !!user,
        mustSetPassword: user ? user.mustSetPassword : true,
        alreadyActive: !!user && !user.mustSetPassword,
        firstName: patient?.firstName || user?.firstName || "",
        lastName: patient?.lastName || user?.lastName || "",
        hasEmail: !!email,
        emailMasked: email ? maskEmail(email) : null,
    };
}

/**
 * Contexto de activación a partir de la cookie emitida al reservar.
 */
export async function getActivationSession() {
    const token = (await cookies()).get(ACTIVATION_COOKIE)?.value;
    if (!token) return { pending: false as const };

    const payload = await authService.verifyActivationToken(token);
    if (!payload) return { pending: false as const };

    const patient = await prisma.patient.findUnique({
        where: { documentNumber: payload.dni },
    });

    return {
        pending: true as const,
        dni: payload.dni,
        firstName: patient?.firstName || "",
        lastName: patient?.lastName || "",
        emailMasked: payload.email ? maskEmail(payload.email) : null,
    };
}

/**
 * Envía el código de verificación para activar una cuenta existente.
 */
export async function requestActivationCode(dni: string, email?: string) {
    const normalized = normalizeDni(dni);
    if (!isValidDni(normalized)) return { error: "DNI inválido" };

    const { patient, user } = await findByDni(normalized);
    if (!patient && !user) {
        return { error: "No encontramos ese DNI. Reservá un turno primero." };
    }
    if (user && !user.mustSetPassword) {
        return { error: "Esa cuenta ya está activa. Iniciá sesión." };
    }

    const onFile = user?.email || patient?.email || null;
    const target = onFile || email?.trim().toLowerCase() || null;

    if (!target || !isValidEmail(target)) {
        return { error: "Necesitamos un email válido para enviarte el código." };
    }

    const can = await verificationService.canRequestCode(target);
    if (!can.ok) {
        return { error: "Esperá unos segundos antes de pedir otro código." };
    }

    const sent = await verificationService.requestCode(target, user?.id ?? null);
    if (!sent) {
        return { error: "No pudimos enviar el email. Intentá más tarde." };
    }

    return { ok: true, emailMasked: maskEmail(target) };
}

/**
 * Verifica el código y, si es correcto, habilita el paso de contraseña.
 */
export async function verifyActivationCode(
    dni: string,
    code: string,
    email?: string,
) {
    const normalized = normalizeDni(dni);
    if (!isValidDni(normalized)) return { error: "DNI inválido" };
    if (!code?.trim()) return { error: "Ingresá el código" };

    const { patient, user } = await findByDni(normalized);
    const onFile = user?.email || patient?.email || null;
    const target = onFile || email?.trim().toLowerCase() || null;
    if (!target) return { error: "Falta el email de verificación." };

    const result = await verificationService.verifyCode(target, code);
    if (!result.ok) return { error: result.error || "Código incorrecto." };

    const token = await authService.issueActivationToken({
        dni: normalized,
        email: target,
    });
    (await cookies()).set(ACTIVATION_COOKIE, token, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24,
    });

    return { ok: true };
}

/**
 * Crea la contraseña y activa la cuenta a partir de la cookie de activación.
 */
export async function activateAccount(data: {
    password: string;
    firstName?: string;
    lastName?: string;
}) {
    const token = (await cookies()).get(ACTIVATION_COOKIE)?.value;
    if (!token) return { error: "No hay una activación en curso." };

    const payload = await authService.verifyActivationToken(token);
    if (!payload) return { error: "La activación venció. Volvé a intentar." };

    const password = data.password;
    if (!password || password.length < 8) {
        return { error: "La contraseña debe tener al menos 8 caracteres." };
    }

    const dni = payload.dni;
    const { patient } = await findByDni(dni);
    const hashed = await bcrypt.hash(password, 10);

    const firstName = data.firstName?.trim() || patient?.firstName || undefined;
    const lastName = data.lastName?.trim() || patient?.lastName || undefined;

    // Email verificado (si no está tomado por otra cuenta)
    let email: string | null = null;
    if (payload.email) {
        const conflict = await prisma.user.findFirst({
            where: { email: payload.email, NOT: { dni } },
            select: { id: true },
        });
        if (!conflict) email = payload.email.toLowerCase();
    }

    let user = await prisma.user.findUnique({ where: { dni } });
    if (user) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                mustSetPassword: false,
                email: user.email || email,
                firstName: user.firstName || firstName,
                lastName: user.lastName || lastName,
                fullName:
                    user.fullName ||
                    (firstName && lastName ? `${firstName} ${lastName}` : undefined),
            },
        });
    } else {
        user = await prisma.user.create({
            data: {
                dni,
                password: hashed,
                mustSetPassword: false,
                email: email ?? undefined,
                firstName,
                lastName,
                fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
            },
        });
    }

    const patientRole = await prisma.role.findUnique({ where: { name: "PATIENT" } });
    if (patientRole) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: patientRole.id } },
            update: {},
            create: { userId: user.id, roleId: patientRole.id },
        });
    }

    if (patient) {
        if (!patient.userId || patient.deletedAt) {
            await prisma.patient.update({
                where: { id: patient.id },
                data: { userId: user.id, deletedAt: null },
            });
        }
    } else {
        await prisma.patient.create({
            data: {
                userId: user.id,
                firstName: firstName || "Sin nombre",
                lastName: lastName || "Sin apellido",
                documentNumber: dni,
                email: email ?? undefined,
                billingType: "particular",
            },
        });
    }

    await setSession(user.id);
    (await cookies()).delete(ACTIVATION_COOKIE);

    return { success: true, redirectTo: "/paciente/dashboard" };
}

/**
 * Registro directo de un DNI nuevo (sin email, sin verificación).
 */
export async function registerNewAccount(data: {
    dni: string;
    firstName: string;
    lastName: string;
    password: string;
}) {
    const dni = normalizeDni(data.dni);
    if (!isValidDni(dni)) return { error: "Ingresá un DNI válido (7 u 8 dígitos)." };
    if (!data.firstName?.trim()) return { error: "El nombre es obligatorio." };
    if (!data.lastName?.trim()) return { error: "El apellido es obligatorio." };
    if (!data.password || data.password.length < 8) {
        return { error: "La contraseña debe tener al menos 8 caracteres." };
    }

    const { patient, user } = await findByDni(dni);
    if (user || patient) {
        return { error: "Ese DNI ya está registrado. Iniciá sesión o activá tu cuenta." };
    }

    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const hashed = await bcrypt.hash(data.password, 10);

    const user2 = await prisma.user.create({
        data: {
            dni,
            password: hashed,
            mustSetPassword: false,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
        },
    });

    const patientRole = await prisma.role.findUnique({ where: { name: "PATIENT" } });
    if (patientRole) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user2.id, roleId: patientRole.id } },
            update: {},
            create: { userId: user2.id, roleId: patientRole.id },
        });
    }

    await prisma.patient.create({
        data: {
            userId: user2.id,
            firstName,
            lastName,
            documentNumber: dni,
            billingType: "particular",
        },
    });

    await setSession(user2.id);

    return { success: true, redirectTo: "/paciente/dashboard" };
}
