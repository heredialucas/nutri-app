import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, Eye, Pencil } from "lucide-react";

interface Recipe {
    id: string;
    title: string;
    description: string | null;
    ingredients: string | null;
    instructions: string | null;
}

export function PlanRecipes({ recipes }: { recipes: Recipe[] }) {
    if (recipes.length === 0) {
        return (
            <div className="rounded-xl border p-6 text-center">
                <ChefHat className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Este plan aún no tiene recetas vinculadas.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {recipes.map((recipe) => (
                <div
                    key={recipe.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                    <div className="min-w-0">
                        <p className="font-medium">{recipe.title}</p>
                        {recipe.description && (
                            <p className="text-sm text-muted-foreground truncate">{recipe.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" asChild title="Ver">
                            <Link href={`/dashboard/recetas/${recipe.id}/edit`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar">
                            <Link href={`/dashboard/recetas/${recipe.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
