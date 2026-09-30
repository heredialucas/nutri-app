"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { blockDay, unblockDay } from "@/app/actions/blocked-days";
import { toast } from "sonner";
import { Loader2, Lock, LockOpen } from "lucide-react";

export interface BlockedDayInfo {
    id: string;
    reason: string | null;
}

export function BlockDayDialog({
    date,
    dateLabel,
    blockedDay,
    open,
    onOpenChange,
    onChanged,
}: {
    date: string;
    dateLabel: string;
    blockedDay: BlockedDayInfo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged?: () => void;
}) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setReason(blockedDay?.reason ?? "");
    }, [open, blockedDay]);

    const handleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await blockDay({ date, reason });
            toast.success("Día bloqueado");
            onOpenChange(false);
            onChanged?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al bloquear el día");
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async () => {
        if (!blockedDay) return;
        setLoading(true);
        try {
            await unblockDay(blockedDay.id);
            toast.success("Día desbloqueado");
            onOpenChange(false);
            onChanged?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al desbloquear el día");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {blockedDay ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {blockedDay ? "Desbloquear día" : "Bloquear día"}
                    </DialogTitle>
                    <DialogDescription className="capitalize">
                        {dateLabel}
                    </DialogDescription>
                </DialogHeader>

                {blockedDay ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Este día no ofrece turnos. Al desbloquearlo volverán a estar disponibles
                            los horarios según tu disponibilidad.
                        </p>
                        {blockedDay.reason ? (
                            <div className="rounded-md border bg-muted/40 p-3 text-sm">
                                <p className="text-xs font-medium text-muted-foreground">Motivo</p>
                                <p>{blockedDay.reason}</p>
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Volver
                            </Button>
                            <Button type="button" onClick={handleUnblock} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Desbloquear
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleBlock} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            No se podrán sacar turnos este día (ni presenciales ni online). Los turnos
                            ya agendados se conservan.
                        </p>
                        <div className="space-y-1.5">
                            <Label>Motivo (opcional)</Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Ej: feriado, viaje, capacitación"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Bloquear día
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
