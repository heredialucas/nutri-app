"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { toggleShoppingListItem, deleteShoppingListItem } from "@/app/actions/shopping-lists";

interface ShoppingListItemData {
    id: string;
    name: string;
    quantity: string | null;
    unit: string | null;
    isChecked: boolean;
}

export function ShoppingListItemComponent({ item }: { item: ShoppingListItemData }) {
    const router = useRouter();
    const [toggling, setToggling] = useState(false);

    async function handleToggle() {
        setToggling(true);
        try {
            await toggleShoppingListItem(item.id);
            router.refresh();
        } catch {
            toast.error("Error al actualizar");
        } finally {
            setToggling(false);
        }
    }

    async function handleDelete() {
        try {
            await deleteShoppingListItem(item.id);
            toast.success("Item eliminado");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        }
    }

    return (
        <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors group">
            <Checkbox
                checked={item.isChecked}
                onCheckedChange={handleToggle}
                disabled={toggling}
            />
            <div className="flex-1 min-w-0">
                <span
                    className={`text-sm break-words ${item.isChecked ? "line-through text-muted-foreground" : ""}`}
                >
                    {item.name}
                </span>
                {(item.quantity || item.unit) && (
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                    </span>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
            >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
        </div>
    );
}
