import { getShoppingLists } from "@/app/actions/shopping-lists";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShoppingListsClient } from "./shopping-lists-client";

export const metadata = {
    title: "Listas de compras",
    description: "Gestión de listas de compras para pacientes",
};

export default async function ShoppingListsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const lists = await getShoppingLists();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Listas de compras</h1>
                    <p className="text-muted-foreground text-sm">
                        {lists.length} lista{lists.length !== 1 ? "s" : ""} registrada{lists.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>
            <ShoppingListsClient initialLists={lists as any} />
        </div>
    );
}
