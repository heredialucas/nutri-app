"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pendiente", variant: "outline" },
    CONFIRMED: { label: "Confirmado", variant: "default" },
    COMPLETED: { label: "Completado", variant: "secondary" },
    CANCELLED: { label: "Cancelado", variant: "destructive" },
    NO_SHOW: { label: "No asistió", variant: "destructive" },
    RESCHEDULED: { label: "Reprogramado", variant: "secondary" },
};

export function AppointmentStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

const typeLabels: Record<string, string> = {
    ONLINE: "Online",
    IN_PERSON: "Presencial",
};

export function AppointmentTypeBadge({ type }: { type: string }) {
    return (
        <Badge variant="secondary" className="text-xs">
            {typeLabels[type] || type}
        </Badge>
    );
}
