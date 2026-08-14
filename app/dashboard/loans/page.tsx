import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getLoanFormData, getLoans } from "@/app/actions/loans";
import { LoanForm } from "@/components/loans/loan-form";
import { LoanList } from "@/components/loans/loan-list";
import { UnauthorizedAccess } from "@/components/unauthorized-access";
import { HandCoins } from "lucide-react";

export const metadata = {
    title: "Préstamos | Control de Inventario",
    description: "Registrar egresos de materiales en préstamo",
};

export default async function LoansPage() {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "loans.view")) return <UnauthorizedAccess action="ver" resource="préstamos" />;

    const [loans, formData] = await Promise.all([getLoans(), getLoanFormData()]);
    const canManage = hasPermission(user, "loans.manage");

    return <div className="space-y-8">
        <div className="relative overflow-hidden rounded-xl border bg-card px-6 py-7 shadow-sm sm:px-8">
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex items-start gap-4"><div className="rounded-xl bg-primary/10 p-3 text-primary"><HandCoins className="h-6 w-6" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Almacenamiento · Control de egresos</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Préstamos</h1><p className="mt-2 max-w-2xl text-muted-foreground">Registrá quién retira materiales del depósito, para qué obra y con qué comprobante firmado. La reposición se documenta por el circuito normal de ingresos.</p></div></div>
        </div>
        {canManage && <LoanForm data={formData} />}
        <section className="space-y-4"><div><h2 className="text-xl font-semibold tracking-tight">Historial de préstamos</h2><p className="text-sm text-muted-foreground">{loans.length} egreso{loans.length === 1 ? "" : "s"} documentado{loans.length === 1 ? "" : "s"}</p></div><LoanList loans={loans} /></section>
    </div>;
}
