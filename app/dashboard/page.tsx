import { StatCard } from "@/components/dashboard/stat-card";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { PatientAlerts } from "@/components/dashboard/patient-alerts";
import { RevenueSummary } from "@/components/dashboard/revenue-summary";
import { Users, Calendar, CalendarDays, DollarSign, ClipboardList } from "lucide-react";
import { getDashboardSummary } from "@/app/actions/dashboard";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Dashboard",
    description: "Panel de gestión nutricional",
};

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const data = await getDashboardSummary();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground text-sm">
                    Resumen de tu actividad nutricional
                </p>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Pacientes activos"
                    value={data.activePatients}
                    icon={<Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                    description="En seguimiento"
                />
                <StatCard
                    title="Turnos hoy"
                    value={data.todayAppointments.length}
                    icon={<CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                />
                <StatCard
                    title="Próximos turnos"
                    value={data.upcomingCount}
                    icon={<Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                    description="Pendientes y confirmados"
                />
                <StatCard
                    title="Seguimientos pendientes"
                    value={data.patientsNeedingFollowUp.length}
                    icon={<ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                    description="Sin seguimiento en 14 días"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <TodayAppointments appointments={data.todayAppointments} />
                <RevenueSummary
                    monthlyIncome={data.monthlyIncome}
                    monthlyExpenses={data.monthlyExpenses}
                    monthlyProfit={data.monthlyProfit}
                />
            </div>

            <PatientAlerts patients={data.patientsNeedingFollowUp} />
        </div>
    );
}
