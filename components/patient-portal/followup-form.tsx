"use client";

import { useState } from "react";
import { submitFollowUp } from "@/app/actions/patient-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Check } from "lucide-react";

interface FollowUpFormProps {
    existingFollowUp?: {
        id: string;
        weight?: number;
        adherence?: string;
        hunger?: string;
        energy?: string;
        difficulties?: string;
        patientNotes?: string;
    };
}

const adherenceOptions = [
    { value: "excellent", label: "Excelente" },
    { value: "good", label: "Buena" },
    { value: "regular", label: "Regular" },
    { value: "low", label: "Baja" },
];

const energyOptions = [
    { value: "high", label: "Alta" },
    { value: "medium", label: "Media" },
    { value: "low", label: "Baja" },
];

const hungerOptions = [
    { value: "controlled", label: "Controlado" },
    { value: "moderate", label: "Moderado" },
    { value: "excessive", label: "Excesivo" },
];

export function FollowUpForm({ existingFollowUp }: FollowUpFormProps) {
    const [weight, setWeight] = useState(existingFollowUp?.weight?.toString() || "");
    const [adherence, setAdherence] = useState(existingFollowUp?.adherence || "");
    const [hunger, setHunger] = useState(existingFollowUp?.hunger || "");
    const [energy, setEnergy] = useState(existingFollowUp?.energy || "");
    const [difficulties, setDifficulties] = useState(existingFollowUp?.difficulties || "");
    const [patientNotes, setPatientNotes] = useState(existingFollowUp?.patientNotes || "");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submitFollowUp({
                weight: weight ? parseFloat(weight) : undefined,
                adherence: adherence || undefined,
                hunger: hunger || undefined,
                energy: energy || undefined,
                difficulties: difficulties || undefined,
                patientNotes: patientNotes || undefined,
            });
            setDone(true);
        } catch {
            alert("Error al enviar el seguimiento");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                <div className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-3">
                    <Check size={20} className="text-[#22c55e]" />
                </div>
                <p className="text-sm font-medium text-[#1a1a1a] m-0 mb-1">
                    ¡Check-in enviado!
                </p>
                <p className="text-xs text-[#666] m-0">
                    Gracias por compartir tu progreso. Mauro Acosta lo revisará.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
            <div className="space-y-4">
                {/* Weight */}
                <div className="grid gap-2">
                    <Label htmlFor="weight" className="text-sm font-medium text-[#1a1a1a] flex items-center gap-2">
                        <Scale size={14} className="text-[#999]" />
                        Peso actual (kg)
                    </Label>
                    <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="Ej: 72.5"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="max-w-[140px]"
                    />
                </div>

                {/* Adherence */}
                <div className="grid gap-2">
                    <Label className="text-sm font-medium text-[#1a1a1a]">
                        ¿Qué tan bien seguí el plan?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {adherenceOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAdherence(adherence === opt.value ? "" : opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                    adherence === opt.value
                                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                        : "bg-white text-[#666] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.24)]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hunger */}
                <div className="grid gap-2">
                    <Label className="text-sm font-medium text-[#1a1a1a]">
                        ¿Cómo sentiste el hambre?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {hungerOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setHunger(hunger === opt.value ? "" : opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                    hunger === opt.value
                                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                        : "bg-white text-[#666] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.24)]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Energy */}
                <div className="grid gap-2">
                    <Label className="text-sm font-medium text-[#1a1a1a]">
                        Nivel de energía
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {energyOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setEnergy(energy === opt.value ? "" : opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                    energy === opt.value
                                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                        : "bg-white text-[#666] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.24)]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulties */}
                <div className="grid gap-2">
                    <Label htmlFor="difficulties" className="text-sm font-medium text-[#1a1a1a]">
                        Dificultades (opcional)
                    </Label>
                    <Input
                        id="difficulties"
                        placeholder="Contanos si tuviste alguna dificultad..."
                        value={difficulties}
                        onChange={(e) => setDifficulties(e.target.value)}
                    />
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-[#1a1a1a]">
                        Notas adicionales (opcional)
                    </Label>
                    <Input
                        id="notes"
                        placeholder="Algo que quieras compartir..."
                        value={patientNotes}
                        onChange={(e) => setPatientNotes(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-5">
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : existingFollowUp ? "Actualizar check-in" : "Enviar check-in"}
                </Button>
            </div>
        </form>
    );
}
