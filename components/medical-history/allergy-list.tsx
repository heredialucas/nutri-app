"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { addAllergy, deleteAllergy } from "@/app/actions/medical-history";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Allergy {
    id: string;
    name: string;
    reaction?: string | null;
    severity?: string | null;
    notes?: string | null;
}

export function AllergyList({
    patientId,
    allergies,
}: {
    patientId: string;
    allergies: Allergy[];
}) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", reaction: "", severity: "MODERATE", notes: "" });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addAllergy(patientId, {
                name: form.name,
                reaction: form.reaction || undefined,
                severity: form.severity || undefined,
                notes: form.notes || undefined,
            });
            toast.success("Alergia agregada");
            setForm({ name: "", reaction: "", severity: "MODERATE", notes: "" });
            setShowForm(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta alergia?")) return;
        try {
            await deleteAllergy(id);
            toast.success("Alergia eliminada");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-3">
            {allergies.length > 0 && (
                <div className="space-y-2">
                    {allergies.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">{a.name}</Badge>
                                {a.severity && (
                                    <Badge variant="outline">{a.severity}</Badge>
                                )}
                                {a.reaction && (
                                    <span className="text-sm text-muted-foreground">{a.reaction}</span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(a.id)}
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
                                placeholder="Ej: Maní, Glúten"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Reacción</Label>
                            <Input
                                value={form.reaction}
                                onChange={(e) => setForm({ ...form, reaction: e.target.value })}
                                placeholder="Ej: Hinchazón, urticaria"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Severidad</Label>
                            <Select
                                value={form.severity}
                                onValueChange={(v) => setForm({ ...form, severity: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Leve</SelectItem>
                                    <SelectItem value="MODERATE">Moderada</SelectItem>
                                    <SelectItem value="HIGH">Severa</SelectItem>
                                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Notas</Label>
                            <Input
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                    Agregar alergia
                </Button>
            )}
        </div>
    );
}
