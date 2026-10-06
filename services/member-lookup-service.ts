import { normalizeDni } from "@/lib/dni";

/**
 * Punto de integración para traer datos de un paciente a partir de su DNI
 * desde una fuente externa (padrón de socios del gimnasio, tabla importada,
 * API del gimnasio, etc.).
 *
 * HOY NO ESTÁ CONECTADO: devuelve `null`. El intake por QR ya consulta este
 * servicio, así que cuando exista la fuente real solo hay que completar
 * `fetchFromSource` sin tocar el flujo de reserva.
 */

export interface MemberData {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    dni?: string;
    source?: string;
}

async function fetchFromSource(dni: string): Promise<MemberData | null> {
    // TODO: implementar cuando exista la tabla/API externa.
    // Ejemplo:
    // const member = await prisma.gymMember.findUnique({ where: { documentNumber: dni } });
    // if (!member) return null;
    // return { firstName: member.firstName, ... };
    void dni;
    return null;
}

export const memberLookupService = {
    async lookupByDni(dni: string | null | undefined): Promise<MemberData | null> {
        const normalized = normalizeDni(dni);
        if (!normalized) return null;

        try {
            const member = await fetchFromSource(normalized);
            if (!member) return null;
            return { ...member, dni: normalized };
        } catch (error) {
            console.error(
                "[member-lookup] Error consultando padrón externo:",
                error instanceof Error ? error.message : error,
            );
            return null;
        }
    },
};
