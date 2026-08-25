"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addMedication, deleteMedication } from "@/app/actions/medical-history";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";

interface Medication {
    id: string;
    name: string;
    dosage?: string | null;
    frequency?: string | null;
    indication?: string | null;
    notes?: string | null;
}

export function MedicationList({
    patientId,
    medications,
}: {
    patientId: string;
    medications: Medication[];
}) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", dosage: "", frequency: "", indication: "", notes: "" });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addMedication(patientId, {
                name: form.name,
                dosage: form.dosage || undefined,
                frequency: form.frequency || undefined,
                indication: form.indication || undefined,
                notes: form.notes || undefined,
            });
            toast.success("Medicación agregada");
            setForm({ name: "", dosage: "", frequency: "", indication: "", notes: "" });
            setShowForm(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta medicación?")) return;
        try {
            await deleteMedication(id);
            toast.success("Medicación eliminada");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-3">
            {medications.length > 0 && (
                <div className="space-y-2">
                    {medications.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="text-sm">
                                <span className="font-medium">{m.name}</span>
                                {m.dosage && <span className="text-muted-foreground"> — {m.dosage}</span>}
                                {m.frequency && <span className="text-muted-foreground"> ({m.frequency})</span>}
                                {m.indication && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{m.indication}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(m.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {showForm ? (
                <form onSubmit={handleAdd} className="space-y-3 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Nombre *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Dosis</Label>
                            <Input
                                value={form.dosage}
                                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                                placeholder="Ej: 500mg"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Frecuencia</Label>
                            <Input
                                value={form.frequency}
                                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                                placeholder="Ej: 2 veces al día"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Indicación</Label>
                            <Input
                                value={form.indication}
                                onChange={(e) => setForm({ ...form, indication: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Agregando..." : "Agregar"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            ) : (
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar medicación
                </Button>
            )}
        </div>
    );
}
