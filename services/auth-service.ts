import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { sendEmail } from "@/lib/email";
import { normalizeDni } from "@/lib/dni";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-change-me-in-prod"
);

const ALG = "HS256";

export const authService = {
    async register(data: {
        email?: string | null;
        password: string;
        username?: string | null;
        dni?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<any> {
        const email = data.email?.trim() || null;
        const username = data.username?.trim() || null;
        const dni = data.dni ? normalizeDni(data.dni) : null;

        if (!email && !dni) {
            throw new Error("Se requiere un email o un DNI");
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) throw new Error("El email ya está registrado");
        }

        if (dni) {
            const existingDni = await prisma.user.findUnique({ where: { dni } });
            if (existingDni) throw new Error("El DNI ya está registrado");
        }

        if (username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } });
            if (existingUsername) throw new Error("El nombre de usuario ya está en uso");
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                dni,
                username,
                password: hashedPassword,
                firstName: data.firstName?.trim() || undefined,
                lastName: data.lastName?.trim() || undefined,
                fullName:
                    data.firstName && data.lastName
                        ? `${data.firstName.trim()} ${data.lastName.trim()}`
                        : undefined,
            },
        });

        return user;
    },

    async login(identifier: string, password: string): Promise<{ user: any; token: string }> {
        const trimmed = identifier.trim();
        const digits = normalizeDni(trimmed);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: trimmed },
                    { username: trimmed },
                    ...(digits ? [{ dni: digits }] : []),
                ]
            }
        });

        if (!user) {
            throw new Error("Credenciales inválidas");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error("Credenciales inválidas");
        }

        // No permitir iniciar sesión a cuentas desactivadas (p. ej. pacientes eliminados)
        if (user.isActive === false) {
            throw new Error("Tu cuenta ha sido desactivada. Contactá a tu nutricionista.");
        }

        const token = await this.issueToken(user);

        return { user, token };
    },

    /**
     * Genera un token de sesión para un usuario ya validado.
     */
    async issueToken(user: {
        id: string;
        email: string | null;
        username?: string | null;
    }): Promise<string> {
        return new SignJWT({
            userId: user.id,
            email: user.email,
            username: user.username ?? null,
        })
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(SECRET_KEY);
    },

    async verifySession(token: string) {
        try {
            const { payload } = await jwtVerify(token, SECRET_KEY, {
                algorithms: [ALG],
            });
            return payload;
        } catch (error) {
            return null;
        }
    },

    /**
     * Token de corta vida que autoriza a crear la contraseña de una cuenta
     * (activación). Se emite tras reservar (cuenta nueva) o tras verificar
     * el código por email (cuenta existente sin activar).
     */
    async issueActivationToken(data: {
        dni: string;
        email?: string | null;
    }): Promise<string> {
        return new SignJWT({
            purpose: "activate",
            dni: data.dni,
            email: data.email ?? null,
        })
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(SECRET_KEY);
    },

    async verifyActivationToken(
        token: string,
    ): Promise<{ dni: string; email: string | null } | null> {
        try {
            const { payload } = await jwtVerify(token, SECRET_KEY, {
                algorithms: [ALG],
            });
            if (payload.purpose !== "activate" || typeof payload.dni !== "string") {
                return null;
            }
            return {
                dni: payload.dni,
                email: typeof payload.email === "string" ? payload.email : null,
            };
        } catch {
            return null;
        }
    },

    async requestPasswordReset(email: string): Promise<void> {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || !user.email) {
            return;
        }

        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/auth/update-password?token=${rawToken}`;

        const sent = await sendEmail({
            to: user.email,
            subject: "Restablecer contraseña · Mauro Acosta",
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2a26"><h2>Restablecer contraseña</h2><p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><p><a href="${resetUrl}" style="background:#13805b;color:white;padding:12px 18px;border-radius:6px;text-decoration:none">Crear nueva contraseña</a></p><p>El enlace vence en una hora y solo puede utilizarse una vez.</p></div>`,
        });
        if (!sent) throw new Error("No se pudo enviar el correo de recuperación");
    },

    async resetPassword(rawToken: string, password: string): Promise<void> {
        if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");
        const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw new Error("El enlace no es válido o venció");
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.$transaction([
            prisma.user.update({ where: { id: reset.userId }, data: { password: hashedPassword } }),
            prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
        ]);
    },

    async updatePassword(password: string, userId: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    },
};
