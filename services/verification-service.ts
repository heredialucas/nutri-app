import prisma from "@/lib/prisma";
import { createHash, randomInt } from "node:crypto";
import { sendEmail } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(email: string, code: string): string {
    return createHash("sha256")
        .update(`${email.toLowerCase()}:${code}`)
        .digest("hex");
}

export const verificationService = {
    /**
     * Indica si se puede pedir un nuevo código (evita spam de reenvíos).
     */
    async canRequestCode(email: string): Promise<{ ok: boolean; retryInMs?: number }> {
        const normalized = email.trim().toLowerCase();
        const recent = await prisma.emailVerificationCode.findFirst({
            where: { email: normalized, consumedAt: null },
            orderBy: { createdAt: "desc" },
        });
        if (
            recent &&
            Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS
        ) {
            return {
                ok: false,
                retryInMs:
                    RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime()),
            };
        }
        return { ok: true };
    },

    /**
     * Genera y envía un código de 6 dígitos. Invalida los anteriores.
     */
    async requestCode(
        email: string,
        userId?: string | null,
    ): Promise<boolean> {
        const normalized = email.trim().toLowerCase();

        await prisma.emailVerificationCode.updateMany({
            where: { email: normalized, consumedAt: null },
            data: { consumedAt: new Date() },
        });

        const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
        await prisma.emailVerificationCode.create({
            data: {
                email: normalized,
                userId: userId ?? null,
                codeHash: hashCode(normalized, code),
                expiresAt: new Date(Date.now() + CODE_TTL_MS),
            },
        });

        return sendEmail({
            to: normalized,
            subject: "Tu código de verificación · Mauro Acosta",
            html: `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2a26;max-width:480px">
  <h2 style="margin:0 0 8px">Verificá tu email</h2>
  <p style="margin:0 0 16px;color:#64748b;font-size:14px">Mauro Acosta · Gestión nutricional</p>
  <p>Usá este código para activar tu cuenta:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
  <p style="color:#64748b;font-size:13px">El código vence en 10 minutos. Si no solicitaste esto, ignorá este mensaje.</p>
</div>`,
        });
    },

    /**
     * Verifica el código. Devuelve el userId asociado si corresponde.
     */
    async verifyCode(
        email: string,
        code: string,
    ): Promise<{ ok: boolean; userId?: string | null; error?: string }> {
        const normalized = email.trim().toLowerCase();
        const record = await prisma.emailVerificationCode.findFirst({
            where: { email: normalized, consumedAt: null },
            orderBy: { createdAt: "desc" },
        });

        if (!record) {
            return { ok: false, error: "No hay un código pendiente. Pedí uno nuevo." };
        }
        if (record.expiresAt < new Date()) {
            return { ok: false, error: "El código venció. Pedí uno nuevo." };
        }
        if (record.attempts >= MAX_ATTEMPTS) {
            return { ok: false, error: "Demasiados intentos. Pedí un código nuevo." };
        }

        const match = hashCode(normalized, code.trim()) === record.codeHash;
        if (!match) {
            await prisma.emailVerificationCode.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            return { ok: false, error: "Código incorrecto." };
        }

        await prisma.emailVerificationCode.update({
            where: { id: record.id },
            data: { consumedAt: new Date() },
        });

        return { ok: true, userId: record.userId };
    },
};
