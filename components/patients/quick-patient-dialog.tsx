"use client";

import { useEffect, useState } from "react";
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
} from "@/components/ui/dialog";
import { createPatient } from "@/app/actions/patients";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface QuickPatient {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone?: string | null;
}

export function QuickPatientDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (patient: QuickPatient) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
    });

    useEffect(() => {
        if (open) setForm({ firstName: "", lastName: "", phone: "", email: "" });
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim()) {
            toast.error("Nombre y apellido son obligatorios");
            return;
        }

        setLoading(true);
        try {
            const patient = await createPatient({
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone || undefined,
                email: form.email || undefined,
                billingType: "PARTICULAR",
            });
            toast.success("Paciente creado");
            onCreated({
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email ?? null,
                phone: patient.phone ?? null,
            });
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al crear el paciente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nuevo paciente</DialogTitle>
                    <DialogDescription>
                        Cargá los datos básicos. El resto de la información se completa después desde su ficha.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Nombre</Label>
                            <Input
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Apellido</Label>
                            <Input
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Teléfono (opcional)</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email (opcional)</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !form.firstName.trim() || !form.lastName.trim()}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Crear paciente
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
