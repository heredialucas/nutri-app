"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Sparkles, ChefHat, ListOrdered, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/app/actions/recipes";
import { AIRecipeGenerator } from "./ai-recipe-generator";
import type { GeneratedRecipe } from "@/lib/ai/recipe-generator";

export function NewRecipeClient() {
    const router = useRouter();
    const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!recipe) return;
        setSaving(true);
        try {
            await createRecipe({
                title: recipe.title,
                description: recipe.description || undefined,
                ingredients: recipe.ingredients || undefined,
                instructions: recipe.instructions || undefined,
            });
            toast.success("Receta creada");
            router.push("/dashboard/recetas");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof GeneratedRecipe, value: string) => {
        if (!recipe) return;
        setRecipe({ ...recipe, [field]: value });
    };

    if (recipe) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/recetas">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">Editar receta</h1>
                    </div>
                    <Badge variant="secondary">
                        <Sparkles className="mr-1 size-3" />
                        Generado con IA
                    </Badge>
                </div>

                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título</label>
                            <Input
                                value={recipe.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                className="text-lg font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción</label>
                            <Textarea
                                value={recipe.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                rows={2}
                                className="resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <ListOrdered className="size-4 text-muted-foreground" />
                                <label className="text-sm font-medium">Ingredientes</label>
                            </div>
                            <Textarea
                                value={recipe.ingredients}
                                onChange={(e) => updateField("ingredients", e.target.value)}
                                rows={12}
                                className="resize-none font-mono text-sm"
                                placeholder="Un ingrediente por línea..."
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="size-4 text-muted-foreground" />
                                <label className="text-sm font-medium">Instrucciones</label>
                            </div>
                            <Textarea
                                value={recipe.instructions}
                                onChange={(e) => updateField("instructions", e.target.value)}
                                rows={12}
                                className="resize-none text-sm"
                                placeholder="Pasos de preparación..."
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setRecipe(null)}>
                        Volver
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 size-4" />
                        {saving ? "Guardando..." : "Guardar receta"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/recetas">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nueva receta</h1>
                    <p className="text-muted-foreground text-sm">
                        Describí la receta que necesitás y la IA la genera por vos
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <ChefHat className="size-5 text-emerald-500" />
                        <h2 className="font-semibold">Generar receta con IA</h2>
                    </div>
                    <AIRecipeGenerator onGenerated={setRecipe} />
                </CardContent>
            </Card>
        </div>
    );
}
