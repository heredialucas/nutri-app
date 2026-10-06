import { locationService } from "@/services/location-service";
import IntakeChat from "./intake-chat";

export const metadata = {
    title: "Reservá tu turno",
    description: "Reservá tu consulta con Mauro Acosta, Gestión nutricional.",
};

export default async function IngresarPage({
    searchParams,
}: {
    searchParams: Promise<{ loc?: string }>;
}) {
    const params = await searchParams;
    const location = params.loc ? await locationService.getById(params.loc) : null;
    const activeLocation =
        location && location.isActive
            ? { id: location.id, name: location.name, address: location.address }
            : null;

    return <IntakeChat location={activeLocation} />;
}
