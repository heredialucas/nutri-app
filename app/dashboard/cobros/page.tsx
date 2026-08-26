import { getPayments } from "@/app/actions/payments";
import { getPatients } from "@/app/actions/patients";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentForm } from "@/components/payments/payment-form";
import { PaymentList } from "@/components/payments/payment-list";
import { CashSummary } from "@/components/payments/cash-summary";
import { getTotalByPeriod } from "@/app/actions/payments";

export const metadata = {
    title: "Cobros",
};

export default async function CobrosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [payments, patients, totalIncome] = await Promise.all([
        getPayments({ from: startOfMonth.toISOString(), to: endOfMonth.toISOString() }).catch(() => []),
        getPatients().catch(() => []),
        getTotalByPeriod(startOfMonth.toISOString(), endOfMonth.toISOString()).catch(() => 0),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Cobros</h1>
                <p className="text-muted-foreground text-sm">
                    Gestión de cobros y pagos de pacientes
                </p>
            </div>

            <CashSummary totalIncome={totalIncome} totalExpenses={0} />

            <div className="grid gap-6 lg:grid-cols-2">
                <PaymentForm patients={patients} />
            </div>

            <PaymentList payments={payments} patients={patients} />
        </div>
    );
}
