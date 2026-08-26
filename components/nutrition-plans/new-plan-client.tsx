"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [showDraftBanner, setShowDraftBanner] = useState(false);

    const { plan: draftPlan, patientId: draftPatientId, patientName: draftPatientName, clearPlan, isStale } = usePlanDraftStore();

    const selectedPatient = patients.find((p) => p.id === selectedPatientId);
    const patientName = selectedPatient
        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
        : "";

    useEffect(() => {
        if (draftPlan && draftPatientId && !isStale()) {
            setSelectedPatientId(draftPatientId);
            setShowDraftBanner(true);
        }
    }, []);

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

    if (generatedPlan && selectedPatientId) {
        return (
            <PlanEditor
                plan={generatedPlan}
                patientId={selectedPatientId}
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
                        Seleccioná un paciente y describí qué tipo de plan necesitás
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
                    <div className="flex items-end gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Paciente *</label>
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar paciente</option>
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedPatientId && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10"
                                onClick={() => setOptionsOpen(true)}
                            >
                                <Settings2 className="mr-1.5 size-3.5" />
                                Opciones
                            </Button>
                        )}
                    </div>

                    {selectedPatientId ? (
                        <AIPlanGenerator
                            patientId={selectedPatientId}
                            patientName={patientName}
                            onGenerated={setGeneratedPlan}
                            optionsOpen={optionsOpen}
                            onOptionsOpenChange={setOptionsOpen}
                        />
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">Seleccioná un paciente para comenzar</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
