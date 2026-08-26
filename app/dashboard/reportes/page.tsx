import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyRevenue, getPatientsSummary, getAppointmentsSummary, getRetentionSummary } from "@/app/actions/reports";
import { RevenueReport } from "@/components/reports/revenue-report";
import { PatientsReport } from "@/components/reports/patients-report";
import { AppointmentsReport } from "@/components/reports/appointments-report";
import { RetentionReport } from "@/components/reports/retention-report";

export const metadata = {
    title: "Reportes",
};

export default async function ReportesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const [revenue, patientsSummary, appointmentsSummary, retention] = await Promise.all([
        getMonthlyRevenue(6).catch(() => []),
        getPatientsSummary().catch(() => ({ total: 0, active: 0, archived: 0, newThisMonth: 0 })),
        getAppointmentsSummary().catch(() => ({ total: 0, completed: 0, cancelled: 0, noShow: 0, pending: 0 })),
        getRetentionSummary().catch(() => ({ totalPatients: 0, activePatients: 0, averageAdherence: null, followUpCount: 0 })),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
                <p className="text-muted-foreground text-sm">
                    Resumen del rendimiento del consultorio
                </p>
            </div>

            <PatientsReport {...patientsSummary} />

            <AppointmentsReport {...appointmentsSummary} />

            <RevenueReport data={revenue} />

            <RetentionReport {...retention} />
        </div>
    );
}
