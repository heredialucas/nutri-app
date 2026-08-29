import { getAppointments } from "@/app/actions/appointments";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { MonthNav } from "@/components/appointments/month-nav";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

export const metadata = {
    title: "Turnos",
    description: "Gestión de turnos",
};

interface PageProps {
    searchParams?: Promise<{ month?: string }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const params = await searchParams;

    const now = new Date();
    const arNow = new Date(now.toLocaleString("en-US", { timeZone: AR_TZ }));

    // Resolve the displayed month from the ?month=YYYY-MM param, defaulting to the current month
    let year = arNow.getFullYear();
    let month = arNow.getMonth();
    if (params?.month) {
        const match = /^(\d{4})-(\d{2})$/.exec(params.month);
        if (match) {
            const y = Number(match[1]);
            const m = Number(match[2]) - 1;
            if (m >= 0 && m <= 11) {
                year = y;
                month = m;
            }
        }
    }

    const fromLocal = new Date(year, month, 1, 0, 0, 0);
    const toLocal = new Date(year, month + 1, 0, 23, 59, 59);
    const from = fromZonedTime(fromLocal, AR_TZ).toISOString();
    const to = fromZonedTime(toLocal, AR_TZ).toISOString();

    const appointments = await getAppointments({ from, to });
    const viewDate = new Date(year, month, 1, 12, 0, 0);

    return (
        <div className="space-y-6">
            <MonthNav year={year} month={month} />
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
                <p className="text-muted-foreground text-sm">
                    Turnos del mes de {formatInTimeZone(viewDate, AR_TZ, "LLLL yyyy", { locale: es })}
                </p>
            </div>
            <AppointmentList appointments={appointments as any} />
        </div>
    );
}
