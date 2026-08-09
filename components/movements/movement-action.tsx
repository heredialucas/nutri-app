"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMovementAction, restoreMovementAction } from "@/app/actions/traceability";

export function MovementAction({ id, deleted = false, canManage }: { id: string; deleted?: boolean; canManage: boolean }) {
    const [isPending, startTransition] = useTransition();
    if (!canManage) return null;

    const run = () => {
        if (!confirm(deleted ? "¿Restaurar este movimiento y recalcular el stock?" : "¿Eliminar lógicamente este movimiento y revertir su impacto en stock?")) return;

        startTransition(async () => {
            const result = deleted ? await restoreMovementAction(id) : await deleteMovementAction(id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(deleted ? "Movimiento restaurado" : "Movimiento eliminado");
            window.location.reload();
        });
    };

    return (
        <Button variant="ghost" size="sm" onClick={run} disabled={isPending} title={deleted ? "Restaurar movimiento" : "Eliminar movimiento"}>
            {deleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            <span className="sr-only">{deleted ? "Restaurar movimiento" : "Eliminar movimiento"}</span>
        </Button>
    );
}
