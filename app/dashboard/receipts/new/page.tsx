import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getExpedientes } from "@/app/actions/expedientes";
import { ReceiptIntakeForm } from "@/components/receipts/receipt-intake-form";
import { UnauthorizedAccess } from "@/components/unauthorized-access";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Cargar Remito | Control de Inventario",
    description: "Controlar el ingreso parcial de mercadería por expediente",
};

export default async function NewReceiptPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!hasPermission(user, "receipts.manage")) {
        return <UnauthorizedAccess action="cargar" resource="remitos" />;
    }

    const expedientes = await getExpedientes({ status: "ABIERTO" });

    return (
        <div className="space-y-6">
            <ReceiptIntakeForm expedientes={expedientes} />
        </div>
    );
}
