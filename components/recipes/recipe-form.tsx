"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRecipe, updateRecipe } from "@/app/actions/recipes";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface RecipeFormProps {
    recipe?: {
        id: string;
        title: string;
        description: string | null;
        ingredients: string | null;
        instructions: string | null;
        imageUrl: string | null;
    };
}

export function RecipeForm({ recipe }: RecipeFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(recipe?.title ?? "");
    const [description, setDescription] = useState(recipe?.description ?? "");
    const [ingredients, setIngredients] = useState(recipe?.ingredients ?? "");
    const [instructions, setInstructions] = useState(recipe?.instructions ?? "");

    const isEditing = !!recipe;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing) {
                await updateRecipe(recipe.id, { title, description, ingredients, instructions });
                toast.success("Receta actualizada");
                router.push(`/dashboard/recetas`);
            } else {
                await createRecipe({ title, description, ingredients, instructions });
                toast.success("Receta creada");
                router.push("/dashboard/recetas");
            }
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Error al guardar la receta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/recetas">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? "Editar receta" : "Nueva receta"}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {isEditing ? "Modificá los datos de la receta" : "Creá una receta para usar en planes alimentarios"}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información general</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Ensalada mediterránea"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descripción de la receta"
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ingredientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="ingredients">Ingredientes (uno por línea)</Label>
                        <Textarea
                            id="ingredients"
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            placeholder={"200g pechuga de pollo\n1 taza de arroz\n100g brócoli\n2 cdas de aceite de oliva"}
                            rows={8}
                        />
                        <p className="text-xs text-muted-foreground">
                            Un ingrediente por línea. Podés incluir cantidades y unidades.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Instrucciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="instructions">Preparación</Label>
                        <Textarea
                            id="instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={"1. Cocinar el arroz según instrucciones del paquete.\n2. Saltear el pollo con aceite.\n3. Mezclar con el brócoli al vapor."}
                            rows={10}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/recetas">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading || !title.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear receta"}
                </Button>
            </div>
        </form>
    );
}
