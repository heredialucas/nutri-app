import { getAppointments } from "@/app/actions/appointments";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

export const metadata = {
    title: "Turnos",
    description: "Gestión de turnos",
};

export default async function AppointmentsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const now = new Date();
    const arNow = new Date(now.toLocaleString("en-US", { timeZone: AR_TZ }));
    const year = arNow.getFullYear();
    const month = arNow.getMonth();

    const fromLocal = new Date(year, month, 1, 0, 0, 0);
    const toLocal = new Date(year, month + 1, 0, 23, 59, 59);
    const from = fromZonedTime(fromLocal, AR_TZ).toISOString();
    const to = fromZonedTime(toLocal, AR_TZ).toISOString();

    const appointments = await getAppointments({ from, to });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
                <p className="text-muted-foreground text-sm">
                    Turnos del mes de {formatInTimeZone(now, AR_TZ, "LLLL yyyy", { locale: es })}
                </p>
            </div>
            <AppointmentList appointments={appointments as any} />
        </div>
    );
}
