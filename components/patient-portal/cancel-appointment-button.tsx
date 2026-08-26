"use client";

import { useState } from "react";
import { requestAppointmentCancel } from "@/app/actions/patient-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XCircle } from "lucide-react";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleCancel = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await requestAppointmentCancel(appointmentId, reason);
            setDone(true);
        } catch {
            alert("No se pudo cancelar el turno");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <span className="text-[10px] text-[#ef4444]">Cancelado</span>
        );
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="text-[10px] text-[#999] hover:text-[#ef4444] transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
                Cancelar
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 mt-1">
            <Input
                placeholder="Motivo (opcional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-8 text-xs"
            />
            <div className="flex gap-1.5">
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-[10px] px-2"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    {loading ? "Cancelando..." : "Confirmar"}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] px-2"
                    onClick={() => setOpen(false)}
                >
                    Volver
                </Button>
            </div>
        </div>
    );
}
