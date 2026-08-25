import { getRecipeById } from "@/app/actions/recipes";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

export const metadata = {
    title: "Editar receta",
    description: "Editar receta existente",
};

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    let recipe;
    try {
        recipe = await getRecipeById(id);
    } catch {
        notFound();
    }

    if (!recipe) notFound();

    return <RecipeForm recipe={recipe as any} />;
}
