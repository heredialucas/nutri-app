import { getAvailability } from "@/app/actions/availability";
import { AvailabilityForm } from "@/components/appointments/availability-form";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Disponibilidad",
    description: "Configurar horarios disponibles",
};

export default async function AvailabilityPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const slots = await getAvailability();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Disponibilidad</h1>
                <p className="text-muted-foreground text-sm">
                    Configurá los horarios en los que atendés
                </p>
            </div>
            <AvailabilityForm slots={slots as any} />
        </div>
    );
}
