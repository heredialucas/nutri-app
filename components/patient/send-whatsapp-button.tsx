"use client";

import { useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendDailySummaryToPatient } from "@/app/actions/notifications";

interface SendWhatsAppSummaryButtonProps {
    patientId: string;
}

export function SendWhatsAppSummaryButton({
    patientId,
}: SendWhatsAppSummaryButtonProps) {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function handleClick() {
        if (!confirming) {
            setConfirming(true);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setConfirming(false), 4000);
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        setConfirming(false);
        setLoading(true);

        try {
            await sendDailySummaryToPatient(patientId);
            toast.success("Resumen enviado por WhatsApp");
        } catch (error) {
            const msg =
                error instanceof Error ? error.message : "Error al enviar";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={loading}
            className={
                confirming
                    ? "flex-1 sm:flex-none border-emerald-600 text-emerald-600 hover:bg-emerald-500/10"
                    : "flex-1 sm:flex-none border-[#25D366]/40 text-[#1DA851] hover:bg-[#25D366]/10"
            }
        >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            {loading
                ? "Enviando…"
                : confirming
                  ? "¿Confirmar envío?"
                  : "Enviar resumen WhatsApp"}
        </Button>
    );
}