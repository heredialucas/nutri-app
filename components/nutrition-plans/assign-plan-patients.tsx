"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { PatientPicker } from "./patient-picker";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    documentNumber?: string | null;
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

                     <PatientPicker patients={patients} selectedIds={selected} onChange={setSelected} label="Pacientes asignados" />

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
