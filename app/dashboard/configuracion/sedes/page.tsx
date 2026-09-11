import { getLocations } from "@/app/actions/locations";
import { LocationManager } from "@/components/locations/location-manager";
import { getCurrentUser, isAdminUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Sedes",
    description: "Sucursales del consultorio",
};

export default async function SedesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user) || !isAdminUser(user)) {
        redirect("/dashboard");
    }

    const locations = await getLocations();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Sedes</h1>
                <p className="text-muted-foreground text-sm">
                    Administrá las sucursales donde atendés. Los pacientes las eligen al reservar un turno presencial.
                </p>
            </div>
            <LocationManager locations={locations as any} />
        </div>
    );
}
