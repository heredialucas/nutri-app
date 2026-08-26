import { getExpenses } from "@/app/actions/expenses";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { CashSummary } from "@/components/payments/cash-summary";
import { getTotalByPeriod } from "@/app/actions/expenses";

export const metadata = {
    title: "Gastos",
};

export default async function GastosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [expenses, totalExpenses] = await Promise.all([
        getExpenses({ from: startOfMonth.toISOString(), to: endOfMonth.toISOString() }).catch(() => []),
        getTotalByPeriod(startOfMonth.toISOString(), endOfMonth.toISOString()).catch(() => 0),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
                <p className="text-muted-foreground text-sm">
                    Control de gastos del consultorio
                </p>
            </div>

            <CashSummary totalIncome={0} totalExpenses={totalExpenses} />

            <div className="grid gap-6 lg:grid-cols-2">
                <ExpenseForm />
            </div>

            <ExpenseList expenses={expenses} />
        </div>
    );
}
