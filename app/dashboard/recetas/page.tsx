import { getRecipes } from "@/app/actions/recipes";
import { RecipeList } from "@/components/recipes/recipe-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Recetas",
    description: "Gestión de recetas del consultorio",
};

export default async function RecipesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const recipes = await getRecipes();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Recetas</h1>
                    <p className="text-muted-foreground text-sm">
                        {recipes.length} receta{recipes.length !== 1 ? "s" : ""} registrada{recipes.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/recetas/new">
                        <ChefHat className="mr-2 h-4 w-4" />
                        Nueva receta
                    </Link>
                </Button>
            </div>
            <RecipeList initialRecipes={recipes as any} />
        </div>
    );
}
