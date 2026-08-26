"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFollowUp, updateFollowUp } from "@/app/actions/followups";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ClipboardList, Save } from "lucide-react";
import { AdherenceField } from "./adherence-field";

interface FollowUpFormProps {
    patientId: string;
    followUp?: any;
    onSuccess?: () => void;
}

export function FollowUpForm({ patientId, followUp, onSuccess }: FollowUpFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const getDefaultWeekStart = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        return monday.toISOString().split("T")[0];
    };

    const [form, setForm] = useState({
        weekStart: followUp?.weekStart?.split("T")[0] || getDefaultWeekStart(),
        weight: followUp?.weight?.toString() || "",
        adherence: followUp?.adherence || "50",
        hunger: followUp?.hunger || "",
        energy: followUp?.energy || "",
        difficulties: followUp?.difficulties || "",
        patientNotes: followUp?.patientNotes || "",
        proNotes: followUp?.proNotes || "",
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                patientId,
                weekStart: form.weekStart,
                weight: form.weight ? parseFloat(form.weight) : undefined,
                adherence: form.adherence || undefined,
                hunger: form.hunger || undefined,
                energy: form.energy || undefined,
                difficulties: form.difficulties || undefined,
                patientNotes: form.patientNotes || undefined,
                proNotes: form.proNotes || undefined,
            };

            if (followUp) {
                await updateFollowUp(followUp.id, {
                    weight: data.weight,
                    adherence: data.adherence,
                    hunger: data.hunger,
                    energy: data.energy,
                    difficulties: data.difficulties,
                    patientNotes: data.patientNotes,
                    proNotes: data.proNotes,
                });
                toast.success("Seguimiento actualizado");
            } else {
                await createFollowUp(data);
                toast.success("Seguimiento registrado");
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        {followUp ? "Editar seguimiento" : "Nuevo seguimiento semanal"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Semana del (lunes)</Label>
                            <Input
                                type="date"
                                value={form.weekStart}
                                onChange={(e) => handleChange("weekStart", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Peso (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.weight}
                                onChange={(e) => handleChange("weight", e.target.value)}
                                placeholder="70.5"
                            />
                        </div>
                    </div>

                    <AdherenceField
                        value={form.adherence}
                        onChange={(val) => handleChange("adherence", val)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Hambre (1-10)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={form.hunger}
                                onChange={(e) => handleChange("hunger", e.target.value)}
                                placeholder="5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Energía (1-10)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={form.energy}
                                onChange={(e) => handleChange("energy", e.target.value)}
                                placeholder="7"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Dificultades</Label>
                        <Textarea
                            value={form.difficulties}
                            onChange={(e) => handleChange("difficulties", e.target.value)}
                            rows={2}
                            placeholder="¿Qué dificultades encontraste esta semana?"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas del paciente</Label>
                        <Textarea
                            value={form.patientNotes}
                            onChange={(e) => handleChange("patientNotes", e.target.value)}
                            rows={2}
                            placeholder="Comentarios adicionales del paciente..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas del profesional</Label>
                        <Textarea
                            value={form.proNotes}
                            onChange={(e) => handleChange("proNotes", e.target.value)}
                            rows={2}
                            placeholder="Observaciones profesionales..."
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : followUp ? "Actualizar" : "Registrar seguimiento"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
