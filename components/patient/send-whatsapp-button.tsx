"use client";

import { useState } from "react";
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

    async function handleClick() {
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
            className="flex-1 sm:flex-none border-[#25D366]/40 text-[#1DA851] hover:bg-[#25D366]/10"
        >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            {loading ? "Enviando…" : "Enviar resumen WhatsApp"}
        </Button>
    );
}