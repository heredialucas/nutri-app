"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Sparkles, ShoppingCart, Plus, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createShoppingList } from "@/app/actions/shopping-lists";
import { AIShoppingListGenerator } from "./ai-shopping-list-generator";
import type { GeneratedShoppingList } from "@/lib/ai/shopping-list-generator";

export function NewShoppingListClient() {
    const router = useRouter();
    const [list, setList] = useState<GeneratedShoppingList | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!list) return;
        setSaving(true);
        try {
            await createShoppingList({
                title: list.title,
                items: list.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity || undefined,
                    unit: item.unit || undefined,
                })),
            });
            toast.success("Lista de compras creada");
            router.push("/dashboard/listas-compras");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const updateItem = (index: number, field: string, value: string) => {
        if (!list) return;
        const items = [...list.items];
        items[index] = { ...items[index], [field]: value };
        setList({ ...list, items });
    };

    const addItem = () => {
        if (!list) return;
        setList({
            ...list,
            items: [...list.items, { name: "", quantity: "", unit: "" }],
        });
    };

    const removeItem = (index: number) => {
        if (!list) return;
        setList({ ...list, items: list.items.filter((_, i) => i !== index) });
    };

    if (list) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/listas-compras">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">Editar lista</h1>
                    </div>
                    <Badge variant="secondary">
                        <Sparkles className="mr-1 size-3" />
                        Generado con IA
                    </Badge>
                </div>

                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <Input
                            value={list.title}
                            onChange={(e) => setList({ ...list, title: e.target.value })}
                            className="text-lg font-semibold"
                            placeholder="Título de la lista"
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {list.items.length} producto{list.items.length !== 1 ? "s" : ""}
                                </span>
                                <Button variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="mr-1 size-3" />
                                    Agregar
                                </Button>
                            </div>

                            <div className="space-y-1">
                                {list.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 group">
                                        <span className="text-muted-foreground text-xs w-5 text-right shrink-0">
                                            {i + 1}
                                        </span>
                                        <Input
                                            value={item.name}
                                            onChange={(e) => updateItem(i, "name", e.target.value)}
                                            placeholder="Producto"
                                            className="flex-1 h-8 text-sm"
                                        />
                                        <Input
                                            value={item.quantity}
                                            onChange={(e) => updateItem(i, "quantity", e.target.value)}
                                            placeholder="Cant."
                                            className="w-20 h-8 text-sm text-center"
                                        />
                                        <Input
                                            value={item.unit}
                                            onChange={(e) => updateItem(i, "unit", e.target.value)}
                                            placeholder="Unidad"
                                            className="w-20 h-8 text-sm"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeItem(i)}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setList(null)}>
                        Volver
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 size-4" />
                        {saving ? "Guardando..." : "Guardar lista"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/listas-compras">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nueva lista de compras</h1>
                    <p className="text-muted-foreground text-sm">
                        Describí la lista que necesitás y la IA la genera por vos
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Wand2 className="size-5 text-blue-500" />
                        <h2 className="font-semibold">Generar lista con IA</h2>
                    </div>
                    <AIShoppingListGenerator onGenerated={setList} />
                </CardContent>
            </Card>
        </div>
    );
}
