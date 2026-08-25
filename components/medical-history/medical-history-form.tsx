"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertMedicalHistory } from "@/app/actions/medical-history";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MedicalHistoryData {
    id?: string;
    familyHistory?: string | null;
    personalHistory?: string | null;
    surgeries?: string | null;
    diagnoses?: string | null;
    habits?: string | null;
    sleepHours?: string | null;
    physicalActivity?: string | null;
    digestiveSymptoms?: string | null;
    observations?: string | null;
}

export function MedicalHistoryForm({
    patientId,
    initialData,
}: {
    patientId: string;
    initialData?: MedicalHistoryData;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<MedicalHistoryData>(initialData || {});

    const handleChange = (field: keyof MedicalHistoryData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await upsertMedicalHistory(patientId, {
                familyHistory: form.familyHistory || undefined,
                personalHistory: form.personalHistory || undefined,
                surgeries: form.surgeries || undefined,
                diagnoses: form.diagnoses || undefined,
                habits: form.habits || undefined,
                sleepHours: form.sleepHours || undefined,
                physicalActivity: form.physicalActivity || undefined,
                digestiveSymptoms: form.digestiveSymptoms || undefined,
                observations: form.observations || undefined,
            });
            toast.success("Historia clínica guardada");
            router.refresh();
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
                    <CardTitle className="text-base">Antecedentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Antecedentes familiares</Label>
                            <Textarea
                                value={form.familyHistory || ""}
                                onChange={(e) => handleChange("familyHistory", e.target.value)}
                                rows={3}
                                placeholder="Enfermedades familiares relevantes..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Antecedentes personales</Label>
                            <Textarea
                                value={form.personalHistory || ""}
                                onChange={(e) => handleChange("personalHistory", e.target.value)}
                                rows={3}
                                placeholder="Enfermedades previas, tratamientos..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cirugías</Label>
                            <Textarea
                                value={form.surgeries || ""}
                                onChange={(e) => handleChange("surgeries", e.target.value)}
                                rows={2}
                                placeholder="Cirugías realizadas..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Diagnósticos informados</Label>
                            <Textarea
                                value={form.diagnoses || ""}
                                onChange={(e) => handleChange("diagnoses", e.target.value)}
                                rows={2}
                                placeholder="Diagnósticos actuales..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-base">Hábitos y estilo de vida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Hábitos</Label>
                            <Textarea
                                value={form.habits || ""}
                                onChange={(e) => handleChange("habits", e.target.value)}
                                rows={2}
                                placeholder="Alimentación, tabaco, alcohol..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Horas de sueño</Label>
                            <Input
                                value={form.sleepHours || ""}
                                onChange={(e) => handleChange("sleepHours", e.target.value)}
                                placeholder="Ej: 7-8 horas"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Actividad física</Label>
                            <Input
                                value={form.physicalActivity || ""}
                                onChange={(e) => handleChange("physicalActivity", e.target.value)}
                                placeholder="Ej: Camina 3 veces por semana"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Síntomas digestivos</Label>
                            <Input
                                value={form.digestiveSymptoms || ""}
                                onChange={(e) => handleChange("digestiveSymptoms", e.target.value)}
                                placeholder="Ej: Reflujo, distensión..."
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Observaciones privadas</Label>
                        <Textarea
                            value={form.observations || ""}
                            onChange={(e) => handleChange("observations", e.target.value)}
                            rows={2}
                            placeholder="Notas privadas del profesional..."
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
                <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar historia clínica"}
                </Button>
            </div>
        </form>
    );
}
