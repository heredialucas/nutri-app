"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChefHat, Trash2, Pencil } from "lucide-react";
import { deleteRecipe } from "@/app/actions/recipes";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export function RecipeList({ initialRecipes }: { initialRecipes: Recipe[] }) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const filtered = initialRecipes.filter(
        (r) =>
            !search ||
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleDelete(id: string) {
        setDeleting(id);
        try {
            await deleteRecipe(id);
            toast.success("Receta eliminada");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Error al eliminar");
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar recetas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {search ? "No se encontraron recetas con esa búsqueda" : "No hay recetas creadas"}
                    </p>
                    {!search && (
                        <Button asChild className="mt-4">
                            <Link href="/dashboard/recetas/new">
                                <ChefHat className="mr-2 h-4 w-4" />
                                Crear receta
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((recipe) => {
                        const ingredientCount = recipe.ingredients
                            ? recipe.ingredients.split("\n").filter((l) => l.trim()).length
                            : 0;

                        return (
                            <div
                                key={recipe.id}
                                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <ChefHat className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{recipe.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {ingredientCount > 0 && (
                                                <span>
                                                    {ingredientCount} ingrediente{ingredientCount !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                            {recipe.instructions && (
                                                <>
                                                    {ingredientCount > 0 && <span>·</span>}
                                                    <span>Con instrucciones</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/dashboard/recetas/${recipe.id}/edit`}>
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Eliminar receta</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    ¿Estás seguro que querés eliminar &quot;{recipe.title}&quot;? Esta acción no se puede deshacer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(recipe.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {deleting === recipe.id ? "Eliminando..." : "Eliminar"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
