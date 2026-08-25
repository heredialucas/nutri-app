"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Trash2, ListChecks } from "lucide-react";
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
import {
    addItemToList,
    deleteShoppingList,
} from "@/app/actions/shopping-lists";
import { ShoppingListItemComponent } from "./shopping-list-item";

interface ShoppingListData {
    id: string;
    title: string;
    patientId: string | null;
    nutritionPlanId: string | null;
    createdAt: string;
    items: {
        id: string;
        name: string;
        quantity: string | null;
        unit: string | null;
        isChecked: boolean;
    }[];
}

export function ShoppingListComponent({ list }: { list: ShoppingListData }) {
    const router = useRouter();
    const [newItemName, setNewItemName] = useState("");
    const [newItemQty, setNewItemQty] = useState("");
    const [newItemUnit, setNewItemUnit] = useState("");
    const [adding, setAdding] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const checkedCount = list.items.filter((i) => i.isChecked).length;
    const totalCount = list.items.length;

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault();
        if (!newItemName.trim()) return;
        setAdding(true);
        try {
            await addItemToList(list.id, {
                name: newItemName.trim(),
                quantity: newItemQty.trim() || undefined,
                unit: newItemUnit.trim() || undefined,
            });
            setNewItemName("");
            setNewItemQty("");
            setNewItemUnit("");
            setShowAddForm(false);
            router.refresh();
        } catch {
            toast.error("Error al agregar item");
        } finally {
            setAdding(false);
        }
    }

    async function handleDeleteList() {
        try {
            await deleteShoppingList(list.id);
            toast.success("Lista eliminada");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        }
    }

    return (
        <div className="border rounded-lg bg-card">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-medium text-sm">{list.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {totalCount > 0 && (
                                <Badge variant={checkedCount === totalCount && totalCount > 0 ? "default" : "secondary"} className="text-xs">
                                    {checkedCount}/{totalCount}
                                </Badge>
                            )}
                            {list.nutritionPlanId && (
                                <Badge variant="outline" className="text-xs">
                                    Generada desde plan
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar lista</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Estás seguro que querés eliminar &quot;{list.title}&quot;? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteList}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddItem} className="flex items-end gap-2 p-3 border-b bg-muted/30">
                    <div className="flex-1 space-y-1">
                        <Input
                            placeholder="Nombre del item"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                        />
                    </div>
                    <div className="w-20">
                        <Input
                            placeholder="Cant."
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="w-20">
                        <Input
                            placeholder="Unidad"
                            value={newItemUnit}
                            onChange={(e) => setNewItemUnit(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                    <Button type="submit" size="sm" disabled={adding || !newItemName.trim()} className="h-8">
                        {adding ? "..." : "Agregar"}
                    </Button>
                </form>
            )}

            <div className="p-2 max-h-64 overflow-y-auto">
                {list.items.length === 0 ? (
                    <div className="text-center py-6">
                        <ListChecks className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Sin items</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {list.items.map((item) => (
                            <ShoppingListItemComponent key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
