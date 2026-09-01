import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-change-me-in-prod"
);

const ALG = "HS256";

export const authService = {
    async register(email: string, password: string, username?: string): Promise<any> {
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            throw new Error("El email ya está registrado");
        }

        if (username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } });
            if (existingUsername) {
                throw new Error("El nombre de usuario ya está en uso");
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
        });

        return user;
    },

    async login(identifier: string, password: string): Promise<{ user: any; token: string }> {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
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

        const token = await new SignJWT({ userId: user.id, email: user.email, username: user.username })
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(SECRET_KEY);

        return { user, token };
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

    async requestPasswordReset(email: string): Promise<void> {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
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
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.RESEND_FROM_EMAIL;
        if (!apiKey || !from) throw new Error("Faltan RESEND_API_KEY o RESEND_FROM_EMAIL");

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                from,
                to: [user.email],
                subject: "Restablecer contraseña · Mauro Acosta",
                html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2a26"><h2>Restablecer contraseña</h2><p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><p><a href="${resetUrl}" style="background:#13805b;color:white;padding:12px 18px;border-radius:6px;text-decoration:none">Crear nueva contraseña</a></p><p>El enlace vence en una hora y solo puede utilizarse una vez.</p></div>`,
            }),
        });
        if (!response.ok) throw new Error("Resend no pudo enviar el correo");
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
