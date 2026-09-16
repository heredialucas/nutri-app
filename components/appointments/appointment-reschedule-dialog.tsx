"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAppointmentSlots, rescheduleAppointment } from "@/app/actions/appointments";
import { minutesBetween } from "@/lib/appointment-rules";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import type { LocationOption } from "./appointment-form-dialog";

const AR_TZ = "America/Argentina/Buenos_Aires";

export interface ReschedulableAppointment {
    id: string;
    startAt: string;
    endAt: string;
    type: "ONLINE" | "IN_PERSON";
    locationId: string | null;
    meetingUrl?: string | null;
    patientName: string;
}

interface AppointmentSlot {
    time: string;
    available: boolean;
    duration: number;
}

function todayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AppointmentRescheduleDialog({
    appointment,
    locations,
    trigger,
    open: controlledOpen,
    onOpenChange,
}: {
    appointment: ReschedulableAppointment;
    locations: LocationOption[];
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const existingDate = formatInTimeZone(new Date(appointment.startAt), AR_TZ, "yyyy-MM-dd");
    const existingTime = formatInTimeZone(new Date(appointment.startAt), AR_TZ, "HH:mm");
    const duration = minutesBetween(new Date(appointment.startAt), new Date(appointment.endAt));

    const [form, setForm] = useState({
        type: appointment.type,
        locationId: appointment.locationId ?? locations[0]?.id ?? "",
        date: existingDate,
        time: existingTime,
        meetingUrl: appointment.meetingUrl ?? "",
    });
    const [slots, setSlots] = useState<AppointmentSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm({
            type: appointment.type,
            locationId: appointment.locationId ?? locations[0]?.id ?? "",
            date: formatInTimeZone(new Date(appointment.startAt), AR_TZ, "yyyy-MM-dd"),
            time: formatInTimeZone(new Date(appointment.startAt), AR_TZ, "HH:mm"),
            meetingUrl: appointment.meetingUrl ?? "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open || !form.date) return;
        if (form.type === "IN_PERSON" && !form.locationId) {
            setSlots([]);
            return;
        }
        let cancelled = false;

        async function load() {
            setSlotsLoading(true);
            try {
                const result = await getAppointmentSlots({
                    date: form.date,
                    locationId: form.type === "IN_PERSON" ? form.locationId || null : null,
                    duration,
                    excludeAppointmentId: appointment.id,
                });
                if (!cancelled) setSlots(result);
            } catch {
                if (!cancelled) setSlots([]);
            } finally {
                if (!cancelled) setSlotsLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [open, form.date, form.type, form.locationId, duration, appointment.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.time) {
            toast.error("Elegí un horario");
            return;
        }
        if (form.type === "IN_PERSON" && !form.locationId) {
            toast.error("Elegí la sede del turno presencial");
            return;
        }

        setLoading(true);
        try {
            await rescheduleAppointment(appointment.id, {
                date: form.date,
                time: form.time,
                type: form.type,
                durationMinutes: duration,
                locationId: form.type === "IN_PERSON" ? form.locationId : null,
                meetingUrl: form.type === "ONLINE" ? form.meetingUrl : undefined,
            });
            toast.success("Turno reprogramado");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al reprogramar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Reprogramar turno</DialogTitle>
                    <DialogDescription>
                        {appointment.patientName} · duración {duration} min
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Tipo</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) =>
                                    setForm((prev) => ({ ...prev, type: v as "IN_PERSON" | "ONLINE", time: "" }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN_PERSON">Presencial</SelectItem>
                                    <SelectItem value="ONLINE">Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.type === "IN_PERSON" && (
                            <div className="space-y-1.5">
                                <Label>Sede</Label>
                                <Select
                                    value={form.locationId}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, locationId: v, time: "" }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Elegí una sede" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((l) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.name}
                                                {l.address ? ` — ${l.address}` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={form.date}
                                min={todayString()}
                                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, time: "" }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Horario disponible</Label>
                        {slotsLoading ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando horarios...
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="py-2 text-sm text-muted-foreground">
                                No hay horarios disponibles para esa fecha.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {slots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        disabled={!slot.available}
                                        onClick={() => setForm((prev) => ({ ...prev, time: slot.time }))}
                                        className={cn(
                                            "h-9 rounded-md border px-3 text-sm font-medium transition-colors",
                                            !slot.available
                                                ? "cursor-not-allowed border-border bg-muted text-muted-foreground/50"
                                                : form.time === slot.time
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background hover:border-primary/50",
                                        )}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {form.type === "ONLINE" && (
                        <div className="space-y-1.5">
                            <Label>Link de videollamada (opcional)</Label>
                            <Input
                                type="url"
                                placeholder="https://..."
                                value={form.meetingUrl}
                                onChange={(e) => setForm((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !form.time}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
