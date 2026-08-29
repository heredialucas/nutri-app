"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMeasurement } from "@/app/actions/measurements";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Ruler } from "lucide-react";

interface MeasurementFormProps {
    patientId: string;
    embedded?: boolean;
    onSuccess?: () => void;
}

export function MeasurementForm({ patientId, embedded = false, onSuccess }: MeasurementFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        weight: "",
        height: "",
        waist: "",
        hip: "",
        arm: "",
        bodyFatPercentage: "",
        muscleMass: "",
        notes: "",
        measuredAt: new Date().toISOString().split("T")[0],
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createMeasurement({
                patientId,
                weight: form.weight ? parseFloat(form.weight) : undefined,
                height: form.height ? parseFloat(form.height) : undefined,
                waist: form.waist ? parseFloat(form.waist) : undefined,
                hip: form.hip ? parseFloat(form.hip) : undefined,
                arm: form.arm ? parseFloat(form.arm) : undefined,
                bodyFatPercentage: form.bodyFatPercentage ? parseFloat(form.bodyFatPercentage) : undefined,
                muscleMass: form.muscleMass ? parseFloat(form.muscleMass) : undefined,
                notes: form.notes || undefined,
                measuredAt: form.measuredAt || undefined,
            });
            toast.success("Medición registrada");
            setForm({
                weight: "",
                height: "",
                waist: "",
                hip: "",
                arm: "",
                bodyFatPercentage: "",
                muscleMass: "",
                notes: "",
                measuredAt: new Date().toISOString().split("T")[0],
            });
            router.refresh();
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const fields = (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={form.height}
                        onChange={(e) => handleChange("height", e.target.value)}
                        placeholder="175"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Cintura (cm)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={form.waist}
                        onChange={(e) => handleChange("waist", e.target.value)}
                        placeholder="80"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Cadera (cm)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={form.hip}
                        onChange={(e) => handleChange("hip", e.target.value)}
                        placeholder="95"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Brazo (cm)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={form.arm}
                        onChange={(e) => handleChange("arm", e.target.value)}
                        placeholder="30"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Grasa corporal (%)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={form.bodyFatPercentage}
                        onChange={(e) => handleChange("bodyFatPercentage", e.target.value)}
                        placeholder="22"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Masa muscular (kg)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={form.muscleMass}
                        onChange={(e) => handleChange("muscleMass", e.target.value)}
                        placeholder="30"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                        type="date"
                        value={form.measuredAt}
                        onChange={(e) => handleChange("measuredAt", e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={2}
                    placeholder="Observaciones..."
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Registrar medición"}
                </Button>
            </div>
        </div>
    );

    if (embedded) {
        return <form onSubmit={handleSubmit}>{fields}</form>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Nueva medición
                    </CardTitle>
                </CardHeader>
                <CardContent>{fields}</CardContent>
            </Card>
        </form>
    );
}