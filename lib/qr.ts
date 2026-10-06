import QRCode from "qrcode";

/**
 * Genera un QR (data URL PNG) para un texto dado. Usado para las
 * entradas de reserva por sede: `${APP_URL}/ingresar?loc=<id>`.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#1a1a1a", light: "#ffffff" },
    });
}

export function getAppBaseUrl(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000"
    ).replace(/\/$/, "");
}

export function buildIntakeUrl(locationId: string): string {
    return `${getAppBaseUrl()}/ingresar?loc=${locationId}`;
}
