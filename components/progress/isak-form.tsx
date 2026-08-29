"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createIsak } from "@/app/actions/isak";
import { ACTIVITY_LEVELS } from "@/lib/isak/calculations";
import { toast } from "sonner";
import { Ruler } from "lucide-react";

interface IsakFormProps {
    patientId: string;
}

const initialForm = {
    measuredAt: new Date().toISOString().split("T")[0],
    activityLevel: "MODERATE",
    sport: "",
    weight: "",
    height: "",
    tricepsSF: "",
    subscapSF: "",
    suprailiacSF: "",
    abdominalSF: "",
    thighSF: "",
    calfSF: "",
    relaxedArm: "",
    flexedArm: "",
    waist: "",
    hip: "",
    midThigh: "",
    calf: "",
    notes: "",
};

const SKINFOLDS: { key: string; label: string; placeholder: string }[] = [
    { key: "tricepsSF", label: "Tríceps", placeholder: "12" },
    { key: "subscapSF", label: "Subescapular", placeholder: "15" },
    { key: "suprailiacSF", label: "Supraespinal", placeholder: "10" },
    { key: "abdominalSF", label: "Abdominal", placeholder: "18" },
    { key: "thighSF", label: "Muslo", placeholder: "20" },
    { key: "calfSF", label: "Pierna", placeholder: "14" },
];

const PERIMETERS: { key: string; label: string; placeholder: string }[] = [
    { key: "relaxedArm", label: "Brazo relajado", placeholder: "28" },
    { key: "flexedArm", label: "Brazo flexionado y contraído", placeholder: "30" },
    { key: "waist", label: "Cintura", placeholder: "80" },
    { key: "hip", label: "Cadera", placeholder: "95" },
    { key: "midThigh", label: "Muslo medio", placeholder: "52" },
    { key: "calf", label: "Pierna", placeholder: "36" },
];

export function IsakForm({ patientId }: IsakFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(initialForm);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const numOrUndefined = (v: string) => (v === "" ? undefined : parseFloat(v));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createIsak({
                patientId,
                measuredAt: form.measuredAt || undefined,
                activityLevel: form.activityLevel || undefined,
                sport: form.sport || undefined,
                weight: numOrUndefined(form.weight),
                height: numOrUndefined(form.height),
                tricepsSF: numOrUndefined(form.tricepsSF),
                subscapSF: numOrUndefined(form.subscapSF),
                suprailiacSF: numOrUndefined(form.suprailiacSF),
                abdominalSF: numOrUndefined(form.abdominalSF),
                thighSF: numOrUndefined(form.thighSF),
                calfSF: numOrUndefined(form.calfSF),
                relaxedArm: numOrUndefined(form.relaxedArm),
                flexedArm: numOrUndefined(form.flexedArm),
                waist: numOrUndefined(form.waist),
                hip: numOrUndefined(form.hip),
                midThigh: numOrUndefined(form.midThigh),
                calf: numOrUndefined(form.calf),
                notes: form.notes || undefined,
            });
            toast.success("Evaluación ISAK registrada");
            setForm(initialForm);
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
                    <CardTitle className="text-base flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Evaluación corporal ISAK
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Datos generales */}
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={form.measuredAt}
                                onChange={(e) => handleChange("measuredAt", e.target.value)}
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
                        <div className="space-y-2">
                            <Label>Altura (cm)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.height}
                                onChange={(e) => handleChange("height", e.target.value)}
                                placeholder="170"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nivel de actividad</Label>
                            <Select
                                value={form.activityLevel}
                                onValueChange={(v) => handleChange("activityLevel", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACTIVITY_LEVELS.map((a) => (
                                        <SelectItem key={a.value} value={a.value}>
                                            {a.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Deporte / disciplina (opcional)</Label>
                            <Input
                                value={form.sport}
                                onChange={(e) => handleChange("sport", e.target.value)}
                                placeholder="P.ej. running"
                            />
                        </div>
                    </div>

                    {/* Pliegues */}
                    <div>
                        <Label className="font-semibold">Pliegues cutáneos (mm)</Label>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                            {SKINFOLDS.map((s) => (
                                <div key={s.key} className="space-y-2">
                                    <Label>{s.label}</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={form[s.key as keyof typeof form] as string}
                                        onChange={(e) => handleChange(s.key, e.target.value)}
                                        placeholder={s.placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Perímetros */}
                    <div>
                        <Label className="font-semibold">Perímetros (cm)</Label>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                            {PERIMETERS.map((p) => (
                                <div key={p.key} className="space-y-2">
                                    <Label>{p.label}</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={form[p.key as keyof typeof form] as string}
                                        onChange={(e) => handleChange(p.key, e.target.value)}
                                        placeholder={p.placeholder}
                                    />
                                </div>
                            ))}
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
                            {loading ? "Guardando..." : "Registrar evaluación"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
