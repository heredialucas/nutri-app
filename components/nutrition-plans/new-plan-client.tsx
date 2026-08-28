"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AIPlanGenerator } from "./ai-plan-generator";
import { PlanEditor } from "./plan-editor";
import { usePlanDraftStore } from "@/stores/plan-draft-store";
import type { GeneratedMealPlan } from "@/lib/ai/meal-plan-generator";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
}

interface NewPlanClientProps {
    patients: Patient[];
}

export function NewPlanClient({ patients }: NewPlanClientProps) {
    const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [showDraftBanner, setShowDraftBanner] = useState(false);

    const { plan: draftPlan, patientId: draftPatientId, patientName: draftPatientName, clearPlan, isStale } = usePlanDraftStore();

    const selectedPatients = patients.filter((p) => selectedPatientIds.includes(p.id));
    const patientName = selectedPatients.length > 0
        ? selectedPatients.map((p) => `${p.firstName} ${p.lastName}`).join(", ")
        : "plan genérico";

    useEffect(() => {
        if (draftPlan && draftPatientId && !isStale()) {
            setSelectedPatientIds([draftPatientId]);
            setShowDraftBanner(true);
        }
    }, []);

    const togglePatient = (id: string) => {
        setSelectedPatientIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleContinueDraft = () => {
        if (draftPlan && draftPatientId) {
            setGeneratedPlan(draftPlan);
            setShowDraftBanner(false);
        }
    };

    const handleDiscardDraft = () => {
        clearPlan();
        setShowDraftBanner(false);
    };

    if (generatedPlan) {
        return (
            <PlanEditor
                plan={generatedPlan}
                patientIds={selectedPatientIds}
                onBack={() => setGeneratedPlan(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/planes">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Nuevo plan alimentario
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Asigná opcionalmente uno o varios pacientes, o creá un plan genérico que podrás asignar luego
                    </p>
                </div>
            </div>

            {showDraftBanner && draftPlan && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <FileText className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Tenés un plan borrador para {draftPatientName}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    ¿Querés continuar editándolo o empezar uno nuevo?
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        onClick={handleContinueDraft}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Continuar borrador
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDiscardDraft}
                                    >
                                        Empezar nuevo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-purple-500" />
                        Generar plan con IA
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Paciente/s</label>
                            <span className="text-xs text-muted-foreground">
                                {selectedPatientIds.length > 0
                                    ? `${selectedPatientIds.length} seleccionado${selectedPatientIds.length > 1 ? "s" : ""}`
                                    : "Plan genérico (opcional)"}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {patients.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                    No hay pacientes cargados — podés crear un plan genérico
                                </span>
                            ) : (
                                patients.map((p) => {
                                    const active = selectedPatientIds.includes(p.id);
                                    return (
                                        <Badge
                                            key={p.id}
                                            variant={active ? "default" : "outline"}
                                            className={`cursor-pointer text-xs py-0.5 px-2 ${
                                                active
                                                    ? "bg-green-600 text-white hover:bg-green-700"
                                                    : "hover:bg-green-50 hover:text-green-700"
                                            }`}
                                            onClick={() => togglePatient(p.id)}
                                        >
                                            {active && <span className="mr-1">✓</span>}
                                            {p.firstName} {p.lastName}
                                        </Badge>
                                    );
                                })
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9"
                                onClick={() => setOptionsOpen(true)}
                            >
                                <Settings2 className="mr-1.5 size-3.5" />
                                Abrir opciones
                            </Button>
                            {selectedPatientIds.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-muted-foreground"
                                    onClick={() => setSelectedPatientIds([])}
                                >
                                    Quitar selección
                                </Button>
                            )}
                        </div>
                    </div>

                    <AIPlanGenerator
                        patientIds={selectedPatientIds}
                        patientName={patientName}
                        onGenerated={setGeneratedPlan}
                        optionsOpen={optionsOpen}
                        onOptionsOpenChange={setOptionsOpen}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
