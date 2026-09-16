"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { createAppointment, getAppointmentSlots } from "@/app/actions/appointments";
import { FIRST_CONSULTATION_DURATION_MINUTES } from "@/lib/appointment-rules";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickPatientDialog } from "@/components/patients/quick-patient-dialog";

export interface PatientOption {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone?: string | null;
    isFirstAppointment: boolean;
}

export interface LocationOption {
    id: string;
    name: string;
    address?: string | null;
}

export interface ProfessionalOption {
    id: string;
    fullName: string | null;
    email: string;
}

interface AppointmentSlot {
    time: string;
    available: boolean;
    duration: number;
}

interface AppointmentFormDialogProps {
    patients: PatientOption[];
    locations: LocationOption[];
    professional: ProfessionalOption;
    defaultDate?: string;
    defaultPatientId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

function todayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AppointmentFormDialog({
    patients,
    locations,
    professional,
    defaultDate,
    defaultPatientId,
    open: controlledOpen,
    onOpenChange,
    trigger,
}: AppointmentFormDialogProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const [patientList, setPatientList] = useState<PatientOption[]>(patients);
    const [patientPickerOpen, setPatientPickerOpen] = useState(false);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slots, setSlots] = useState<AppointmentSlot[]>([]);

    const [form, setForm] = useState({
        patientId: defaultPatientId ?? "",
        type: "IN_PERSON" as "IN_PERSON" | "ONLINE",
        locationId: locations[0]?.id ?? "",
        date: defaultDate ?? todayString(),
        time: "",
        durationMinutes: "30",
        meetingUrl: "",
        notes: "",
    });

    useEffect(() => {
        setPatientList(patients);
    }, [patients]);

    const selectedPatient = useMemo(
        () => patientList.find((p) => p.id === form.patientId) ?? null,
        [patientList, form.patientId],
    );
    const isFirst = selectedPatient?.isFirstAppointment ?? false;
    const effectiveDuration = isFirst
        ? FIRST_CONSULTATION_DURATION_MINUTES
        : Number(form.durationMinutes) || 30;

    // Reset form every time the dialog is opened
    useEffect(() => {
        if (!open) return;
        setForm({
            patientId: defaultPatientId ?? "",
            type: "IN_PERSON",
            locationId: locations[0]?.id ?? "",
            date: defaultDate ?? todayString(),
            time: "",
            durationMinutes: "30",
            meetingUrl: "",
            notes: "",
        });
        setSlots([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultDate, defaultPatientId]);

    // Keep duration in sync with the first-consultation rule
    useEffect(() => {
        if (isFirst) setForm((prev) => ({ ...prev, durationMinutes: String(FIRST_CONSULTATION_DURATION_MINUTES) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFirst]);

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
                    duration: effectiveDuration,
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
    }, [open, form.date, form.type, form.locationId, effectiveDuration]);

    const handlePatientCreated = (patient: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone?: string | null;
    }) => {
        setPatientList((prev) => [
            {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                phone: patient.phone,
                isFirstAppointment: true,
            },
            ...prev,
        ]);
        setForm((prev) => ({
            ...prev,
            patientId: patient.id,
            durationMinutes: String(FIRST_CONSULTATION_DURATION_MINUTES),
            time: "",
        }));
        router.refresh();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.patientId) {
            toast.error("Elegí un paciente");
            return;
        }
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
            await createAppointment({
                patientId: form.patientId,
                type: form.type,
                date: form.date,
                time: form.time,
                durationMinutes: effectiveDuration,
                locationId: form.type === "IN_PERSON" ? form.locationId : null,
                meetingUrl: form.type === "ONLINE" ? form.meetingUrl : undefined,
                notes: form.notes,
            });
            toast.success("Turno creado");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al crear el turno");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = form.patientId && form.time && !loading;

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Nuevo turno</DialogTitle>
                        <DialogDescription>
                            Turno con {professional.fullName ?? professional.email}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium">¿El paciente es nuevo?</p>
                                <p className="text-xs text-muted-foreground">
                                    Creá primero al paciente. Después completás el resto de los datos desde su ficha.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => setQuickCreateOpen(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Crear paciente
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Paciente</Label>
                            <Popover open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={patientPickerOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {selectedPatient
                                            ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                                            : "Buscar paciente..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar por nombre, email o teléfono..." />
                                        <CommandList>
                                            <CommandEmpty>Sin resultados</CommandEmpty>
                                            <CommandGroup>
                                                {patientList.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={`${p.firstName} ${p.lastName} ${p.email ?? ""} ${p.phone ?? ""}`}
                                                        onSelect={() => {
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                patientId: p.id,
                                                                durationMinutes: p.isFirstAppointment
                                                                    ? String(FIRST_CONSULTATION_DURATION_MINUTES)
                                                                    : "30",
                                                                time: "",
                                                            }));
                                                            setPatientPickerOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                form.patientId === p.id ? "opacity-100" : "opacity-0",
                                                            )}
                                                        />
                                                        <span className="flex-1 truncate">
                                                            {p.firstName} {p.lastName}
                                                            {p.email ? (
                                                                <span className="text-muted-foreground"> — {p.email}</span>
                                                            ) : null}
                                                        </span>
                                                        {p.isFirstAppointment && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Primera consulta
                                                            </span>
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {isFirst && (
                                <p className="text-xs font-medium text-primary">
                                    Primera consulta: se agenda con {FIRST_CONSULTATION_DURATION_MINUTES} min
                                    (anamnesis, antropometría y evaluación completa).
                                </p>
                            )}
                        </div>

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

                            <div className="space-y-1.5">
                                <Label>Duración (min)</Label>
                                <Select
                                    value={String(effectiveDuration)}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, durationMinutes: v }))}
                                    disabled={isFirst}
                                >
                                    <SelectTrigger>
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
                                    No hay horarios configurados o libres para esa fecha.
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

                        <div className="space-y-1.5">
                            <Label>Notas (opcional)</Label>
                            <Textarea
                                value={form.notes}
                                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                rows={2}
                                placeholder="Observaciones del turno"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={!canSubmit}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Crear turno
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <QuickPatientDialog
                open={quickCreateOpen}
                onOpenChange={setQuickCreateOpen}
                onCreated={handlePatientCreated}
            />
        </>
    );
}

export function NewAppointmentButton(props: Omit<AppointmentFormDialogProps, "trigger" | "open" | "onOpenChange">) {
    return (
        <AppointmentFormDialog
            {...props}
            trigger={
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo turno
                </Button>
            }
        />
    );
}
