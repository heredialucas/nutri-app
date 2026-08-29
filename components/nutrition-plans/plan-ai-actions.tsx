"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateRecipesFromPlan } from "@/app/actions/ai-recipes";
import { generateShoppingListFromPlanAI } from "@/app/actions/ai-shopping-lists";
import { createRecipe, linkRecipesToPlan } from "@/app/actions/recipes";
import { createShoppingList } from "@/app/actions/shopping-lists";

interface PlanAIActionsProps {
    plan: any;
    patientId?: string;
    planId?: string;
}

export function PlanAIActions({ plan, patientId, planId }: PlanAIActionsProps) {
    const router = useRouter();
    const [generatingRecipes, setGeneratingRecipes] = useState(false);
    const [generatingList, setGeneratingList] = useState(false);
    const busy = generatingRecipes || generatingList;

    const handleGenerateRecipes = async () => {
        setGeneratingRecipes(true);
        try {
            const result = await generateRecipesFromPlan(plan, patientId);
            const ids: string[] = [];
            for (const recipe of result.recipes) {
                const created = await createRecipe({
                    title: recipe.title,
                    description: recipe.description || undefined,
                    ingredients: recipe.ingredients || undefined,
                    instructions: recipe.instructions || undefined,
                });
                ids.push(created.id);
            }
            if (planId && ids.length > 0) {
                await linkRecipesToPlan(ids, planId);
            }
            toast.success(
                `${ids.length} receta${ids.length !== 1 ? "s" : ""} creada${
                    ids.length !== 1 ? "s" : ""
                }${planId ? " y vinculada" + (ids.length !== 1 ? "s" : "") + " al plan" : ""}`
            );
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al generar recetas");
        } finally {
            setGeneratingRecipes(false);
        }
    };

    const handleGenerateShoppingList = async () => {
        setGeneratingList(true);
        try {
            const result = await generateShoppingListFromPlanAI(plan);
            await createShoppingList({
                title: result.title,
                patientId: patientId || undefined,
                nutritionPlanId: planId || undefined,
                items: result.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity || undefined,
                    unit: item.unit || undefined,
                })),
            });
            toast.success("Lista de compras creada. Podés verla en la sección de listas.");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al generar lista de compras");
        } finally {
            setGeneratingList(false);
        }
    };

    return (
        <Card className="border-dashed">
            <CardContent className="pt-6">
                <div className="text-center space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                        ¿Querés generar recetas y lista de compras basadas en este plan?
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleGenerateRecipes}
                            disabled={busy}
                        >
                            {generatingRecipes ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <ChefHat className="mr-2 size-4" />
                            )}
                            {generatingRecipes ? "Generando recetas..." : "Crear recetas del plan"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleGenerateShoppingList}
                            disabled={busy}
                        >
                            {generatingList ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <ShoppingCart className="mr-2 size-4" />
                            )}
                            {generatingList ? "Generando lista..." : "Crear lista de compras"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}