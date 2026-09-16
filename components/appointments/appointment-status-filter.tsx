"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const statusOptions = [
    { value: "ALL", label: "Todos" },
    { value: "PENDING", label: "Pendiente" },
    { value: "CONFIRMED", label: "Confirmado" },
    { value: "COMPLETED", label: "Completado" },
    { value: "CANCELLED", label: "Cancelado" },
    { value: "NO_SHOW", label: "No asistió" },
    { value: "RESCHEDULED", label: "Reprogramado" },
];

export function AppointmentStatusFilter({ value }: { value: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = (next: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next === "ALL") {
            params.delete("status");
        } else {
            params.set("status", next);
        }
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    };

    return (
        <div className="space-y-1.5 w-full sm:w-[180px]">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={value} onValueChange={handleChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
