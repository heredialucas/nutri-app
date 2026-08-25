"use client";

import { Badge } from "@/components/ui/badge";
import { ChefHat } from "lucide-react";

interface Recipe {
    id: string;
    title: string;
    description: string | null;
    ingredients: string | null;
    instructions: string | null;
    imageUrl: string | null;
    createdAt: string;
    professional: { id: string; fullName: string | null };
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
    const ingredientCount = recipe.ingredients
        ? recipe.ingredients.split("\n").filter((l) => l.trim()).length
        : 0;

    return (
        <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
            <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ChefHat className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{recipe.title}</p>
                    {recipe.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {recipe.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        {ingredientCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {ingredientCount} ingrediente{ingredientCount !== 1 ? "s" : ""}
                            </Badge>
                        )}
                        {recipe.instructions && (
                            <Badge variant="outline" className="text-xs">
                                Con instrucciones
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
