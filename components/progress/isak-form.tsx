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
import { updateIsak } from "@/app/actions/isak";
import { ACTIVITY_LEVELS } from "@/lib/isak/calculations";
import { toast } from "sonner";
import { Ruler } from "lucide-react";

interface IsakFormProps {
    patientId: string;
    embedded?: boolean;
    onSuccess?: () => void;
    assessment?: Record<string, unknown>;
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
    humerusBreadth: "",
    femurBreadth: "",
    biStyloidWrist: "",
    biMalleolarAnkle: "",
    biacromial: "",
    biiliocristal: "",
    transverseChest: "",
    apChestDepth: "",
    apAbdominalDepth: "",
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

const BREADTHS: { key: string; label: string; placeholder: string; help?: string }[] = [
    { key: "humerusBreadth", label: "Húmero biepicondilar", placeholder: "7.0", help: "Codo" },
    { key: "femurBreadth", label: "Fémur biepicondilar", placeholder: "9.5", help: "Rodilla" },
    { key: "biStyloidWrist", label: "Muñeca biestiloidea", placeholder: "5.5" },
    { key: "biMalleolarAnkle", label: "Tobillo bimaleolar", placeholder: "7.0" },
    { key: "biacromial", label: "Biacromial", placeholder: "38" },
    { key: "biiliocristal", label: "Biiliocrestal", placeholder: "28" },
    { key: "transverseChest", label: "Tórax transversal", placeholder: "28" },
    { key: "apChestDepth", label: "Tórax anteroposterior", placeholder: "20" },
    { key: "apAbdominalDepth", label: "Abdomen anteroposterior", placeholder: "23" },
];

export function IsakForm({ patientId, embedded = false, onSuccess, assessment }: IsakFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(() => {
        if (!assessment) return initialForm;
        const values = Object.fromEntries(Object.keys(initialForm).map((key) => {
            const value = assessment[key];
            if (key === "measuredAt" && value) return [key, new Date(String(value)).toISOString().split("T")[0]];
            return [key, value == null ? "" : String(value)];
        }));
        return { ...initialForm, ...values };
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const numOrUndefined = (v: string) => (v === "" ? undefined : parseFloat(v));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
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
                humerusBreadth: numOrUndefined(form.humerusBreadth),
                femurBreadth: numOrUndefined(form.femurBreadth),
                biStyloidWrist: numOrUndefined(form.biStyloidWrist),
                biMalleolarAnkle: numOrUndefined(form.biMalleolarAnkle),
                biacromial: numOrUndefined(form.biacromial),
                biiliocristal: numOrUndefined(form.biiliocristal),
                transverseChest: numOrUndefined(form.transverseChest),
                apChestDepth: numOrUndefined(form.apChestDepth),
                apAbdominalDepth: numOrUndefined(form.apAbdominalDepth),
                notes: form.notes || undefined,
            };
            if (assessment?.id) await updateIsak(String(assessment.id), payload);
            else await createIsak(payload);
            toast.success(assessment?.id ? "Evaluación actualizada" : "Evaluación ISAK registrada");
            setForm(initialForm);
            router.refresh();
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="space-y-6">
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

                    {/* Diámetros */}
                    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <Label className="font-semibold text-base">Diámetros óseos (mm)</Label>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                                    Medidas estructurales para comparar proporciones corporales. No indican por sí solas un estado de salud.
                                </p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">ISAK</span>
                        </div>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {BREADTHS.map((b) => (
                                <div key={b.key} className="space-y-2">
                                    <Label>{b.label}</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={form[b.key as keyof typeof form] as string}
                                        onChange={(e) => handleChange(b.key, e.target.value)}
                                        placeholder={b.placeholder}
                                    />
                                    {b.help && <p className="text-[11px] text-muted-foreground">{b.help}</p>}
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
                            {loading ? "Guardando..." : assessment?.id ? "Guardar cambios" : "Registrar evaluación"}
                        </Button>
                    </div>
                </div>
            );

    return (
        <form onSubmit={handleSubmit}>
            {embedded ? (
                content
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Evaluación corporal ISAK
                        </CardTitle>
                    </CardHeader>
                    <CardContent>{content}</CardContent>
                </Card>
            )}
        </form>
    );
}
