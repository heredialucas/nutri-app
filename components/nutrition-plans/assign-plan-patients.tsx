"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { assignPatientsToPlan } from "@/app/actions/nutrition-plans";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
}

interface AssignPlanPatientsProps {
    planId: string;
    patients: Patient[];
    selectedIds: string[];
}

export function AssignPlanPatients({ planId, patients, selectedIds }: AssignPlanPatientsProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(selectedIds);
    const [saving, setSaving] = useState(false);

    const toggle = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await assignPatientsToPlan(planId, selected);
            toast.success("Pacientes asignados correctamente");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al asignar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => { setSelected(selectedIds); setOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar pacientes
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Asignar pacientes</SheetTitle>
                        <SheetDescription>
                            Un plan puede asignarse a uno o varios pacientes.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-1.5">
                            {patients.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No hay pacientes cargados
                                </p>
                            ) : (
                                patients.map((p) => {
                                    const active = selected.includes(p.id);
                                    return (
                                        <Badge
                                            key={p.id}
                                            variant={active ? "default" : "outline"}
                                            className={`cursor-pointer text-xs py-0.5 px-2 ${
                                                active
                                                    ? "bg-green-600 text-white hover:bg-green-700"
                                                    : "hover:bg-green-50 hover:text-green-700"
                                            }`}
                                            onClick={() => toggle(p.id)}
                                        >
                                            {active && <span className="mr-1">✓</span>}
                                            {p.firstName} {p.lastName}
                                        </Badge>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <SheetFooter className="mt-6">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full"
                        >
                            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                            Guardar asignación
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
