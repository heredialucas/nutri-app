import { getAppointments } from "@/app/actions/appointments";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Turnos",
    description: "Gestión de turnos",
};

export default async function AppointmentsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const now = new Date();
    const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).toISOString();
    const to = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();

    const appointments = await getAppointments({ from, to });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
                <p className="text-muted-foreground text-sm">
                    Turnos del mes de {now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                </p>
            </div>
            <AppointmentList appointments={appointments as any} />
        </div>
    );
}
