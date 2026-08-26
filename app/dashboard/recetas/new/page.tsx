import { NewRecipeClient } from "@/components/recipes/new-recipe-client";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Nueva receta",
    description: "Crear una nueva receta",
};

export default async function NewRecipePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    return <NewRecipeClient />;
}
