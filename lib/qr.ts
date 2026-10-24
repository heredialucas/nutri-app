import QRCode from "qrcode";

/**
 * Genera un QR (data URL PNG) para un texto dado. Usado para la
 * entrada general de reserva: `${APP_URL}/ingresar`.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#1a1a1a", light: "#ffffff" },
    });
}

export function getAppBaseUrl(headersList?: { get(name: string): string | null }): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    if (envUrl && !envUrl.includes("localhost")) {
        return envUrl;
    }

    if (headersList) {
        const forwardedHost = headersList.get("x-forwarded-host")?.split(",")[0]?.trim();
        const host = forwardedHost || headersList.get("host")?.trim();
        if (host && !host.includes("localhost")) {
            const proto =
                headersList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
            return `${proto}://${host}`;
        }
        if (host) {
            const proto =
                headersList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
            return `${proto}://${host}`;
        }
    }

    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return envUrl || "http://localhost:3000";
}

export function buildIntakeUrl(headersList?: { get(name: string): string | null }): string {
    return `${getAppBaseUrl(headersList)}/ingresar`;
}
