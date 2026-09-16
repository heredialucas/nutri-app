"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { cancelAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CancelAppointmentDialog({
    appointmentId,
    patientName,
    trigger,
    open: controlledOpen,
    onOpenChange,
}: {
    appointmentId: string;
    patientName: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Indicá el motivo de la cancelación");
            return;
        }

        setLoading(true);
        try {
            await cancelAppointment(appointmentId, reason.trim());
            toast.success("Turno cancelado");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al cancelar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancelar turno</DialogTitle>
                    <DialogDescription>
                        Vas a cancelar el turno de {patientName}. Indicá el motivo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Motivo</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Ej: el paciente no puede asistir"
                            autoFocus
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Volver
                        </Button>
                        <Button type="submit" variant="destructive" disabled={loading || !reason.trim()}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Cancelar turno
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
