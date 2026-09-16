"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { createAvailabilitySlot, deleteAvailabilitySlot, updateAvailabilitySlot } from "@/app/actions/availability";
import { toast } from "sonner";
import { Trash2, Plus, MapPin, Video, Pencil, Check, X } from "lucide-react";

interface AvailabilitySlot {
    id: string;
    locationId: string | null;
    weekday: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    isActive: boolean;
}

interface LocationOption {
    id: string;
    name: string;
}

const weekdayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
];

const ONLINE = "__online__";

export function AvailabilityForm({
    slots,
    locations,
}: {
    slots: AvailabilitySlot[];
    locations: LocationOption[];
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ startTime: "09:00", endTime: "17:00", slotDuration: "30" });
    const [scope, setScope] = useState<string>(locations[0]?.id ?? ONLINE);
    const [form, setForm] = useState({
        weekday: "1",
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: "30",
    });

    const scopeLocationId = scope === ONLINE ? null : scope;

    const scopedSlots = slots.filter(
        (s) => (s.locationId ?? ONLINE) === scope,
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createAvailabilitySlot({
                locationId: scopeLocationId,
                weekday: parseInt(form.weekday),
                startTime: form.startTime,
                endTime: form.endTime,
                slotDuration: parseInt(form.slotDuration),
            });
            toast.success("Horario agregado");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este horario?")) return;
        try {
            await deleteAvailabilitySlot(id);
            toast.success("Horario eliminado");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await updateAvailabilitySlot(id, { isActive });
            toast.success(isActive ? "Horario activado" : "Horario desactivado");
            router.refresh();
        } catch {
            toast.error("Error al actualizar");
        }
    };

    const startEdit = (slot: AvailabilitySlot) => {
        setEditingId(slot.id);
        setEditForm({
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: String(slot.slotDuration),
        });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            await updateAvailabilitySlot(editingId, {
                startTime: editForm.startTime,
                endTime: editForm.endTime,
                slotDuration: parseInt(editForm.slotDuration),
            });
            toast.success("Horario actualizado");
            setEditingId(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al actualizar");
        }
    };

    const groupedSlots = weekdayNames.map((name, index) => ({
        name,
        index,
        slots: scopedSlots.filter((s) => s.weekday === index),
    }));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Sede / modalidad</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={scope} onValueChange={setScope}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ONLINE}>
                                <span className="flex items-center gap-2">
                                    <Video className="h-3.5 w-3.5" /> Online
                                </span>
                            </SelectItem>
                            {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                    <span className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" /> {location.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                        Configurá un horario por sede. Los turnos online usan la opción &quot;Online&quot;.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Agregar horario</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-3">
                        <div className="space-y-1 col-span-2 sm:col-span-1 sm:w-[140px]">
                            <Label>Día</Label>
                            <Select value={form.weekday} onValueChange={(v) => setForm({ ...form, weekday: v })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {weekdayNames.map((name, i) => (
                                        <SelectItem key={i} value={String(i)}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Inicio</Label>
                            <Input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="w-full sm:w-[120px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Fin</Label>
                            <Input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="w-full sm:w-[120px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Duración (min)</Label>
                            <Select
                                value={form.slotDuration}
                                onValueChange={(v) => setForm({ ...form, slotDuration: v })}
                            >
                                <SelectTrigger className="w-full sm:w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                    <SelectItem value="90">90 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={loading} className="col-span-2 sm:col-span-1">
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {groupedSlots.map((group) => (
                    <Card key={group.index}>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                {group.name}
                                {scope !== ONLINE && (
                                    <Badge variant="secondary" className="font-normal">
                                        {locations.find((l) => l.id === scope)?.name}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {group.slots.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Sin horarios configurados</p>
                            ) : (
                                <div className="space-y-2">
                                    {group.slots.map((slot) =>
                                        editingId === slot.id ? (
                                            <div
                                                key={slot.id}
                                                className="flex flex-wrap items-center gap-2 p-2 rounded border"
                                            >
                                                <Input
                                                    type="time"
                                                    value={editForm.startTime}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, startTime: e.target.value })
                                                    }
                                                    className="h-8 w-[110px]"
                                                />
                                                <Input
                                                    type="time"
                                                    value={editForm.endTime}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, endTime: e.target.value })
                                                    }
                                                    className="h-8 w-[110px]"
                                                />
                                                <Select
                                                    value={editForm.slotDuration}
                                                    onValueChange={(v) =>
                                                        setEditForm({ ...editForm, slotDuration: v })
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-[100px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="15">15 min</SelectItem>
                                                        <SelectItem value="30">30 min</SelectItem>
                                                        <SelectItem value="45">45 min</SelectItem>
                                                        <SelectItem value="60">60 min</SelectItem>
                                                        <SelectItem value="90">90 min</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-primary"
                                                        onClick={handleSaveEdit}
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between gap-2 p-2 rounded border"
                                            >
                                                <span
                                                    className={`text-sm font-mono min-w-0 break-words ${
                                                        slot.isActive ? "" : "text-muted-foreground line-through"
                                                    }`}
                                                >
                                                    {slot.startTime} — {slot.endTime}
                                                    <span className="text-muted-foreground ml-2 font-sans no-underline">
                                                        ({slot.slotDuration} min)
                                                    </span>
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Switch
                                                        checked={slot.isActive}
                                                        onCheckedChange={(checked) => handleToggle(slot.id, checked)}
                                                        aria-label="Activar o desactivar horario"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => startEdit(slot)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDelete(slot.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
