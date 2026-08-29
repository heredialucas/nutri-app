"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanDayCards } from "./plan-day-cards";

interface PlanData {
    id: string;
    title: string;
    description: string | null;
    status: string;
    calorieTarget: number | null;
    proteinTarget: number | null;
    carbTarget: number | null;
    fatTarget: number | null;
    notes: string | null;
    tips: string | null;
    supplements?: Array<{
        id?: string;
        name: string;
        dosage: string | null;
        timing: string | null;
        frequency: string | null;
        notes: string | null;
    }>;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    patients: Array<{
        patient: { firstName: string; lastName: string };
    }>;
    professional: { fullName: string };
    days: {
        id?: string;
        dayOrder: number;
        label: string;
        meals: {
            id?: string;
            label: string;
            mealOrder: number;
            notes: string | null;
            foods: {
                id?: string;
                name: string;
                quantity: string | null;
                unit: string | null;
                notes: string | null;
                calories?: number | null;
                protein?: number | null;
                carbs?: number | null;
                fat?: number | null;
            }[];
        }[];
    }[];
}

const statusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    ARCHIVED: "Archivado",
};

export function PlanPreview({ plan }: { plan: PlanData }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0">
                        <CardTitle className="text-xl break-words">{plan.title}</CardTitle>
                        <p className="text-sm text-muted-foreground break-words">
                            Para:{" "}
                            {plan.patients && plan.patients.length > 0
                                ? plan.patients
                                      .map((x) => `${x.patient.firstName} ${x.patient.lastName}`)
                                      .join(", ")
                                : "Sin asignar"}
                        </p>
                        {plan.description && (
                            <p className="text-sm text-muted-foreground break-words">{plan.description}</p>
                        )}
                    </div>
                    <Badge
                        variant={
                            plan.status === "ACTIVE"
                                ? "default"
                                : plan.status === "DRAFT"
                                ? "secondary"
                                : "outline"
                        }
                        className="shrink-0 w-fit sm:ml-4"
                    >
                        {statusLabels[plan.status]}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {plan.startDate && (
                        <span>Inicio: {new Date(plan.startDate).toLocaleDateString("es-AR")}</span>
                    )}
                    {plan.endDate && (
                        <span>Fin: {new Date(plan.endDate).toLocaleDateString("es-AR")}</span>
                    )}
                    {plan.calorieTarget && (
                        <span>
                            Meta: {plan.calorieTarget} kcal
                            {plan.proteinTarget && ` · ${plan.proteinTarget}g P`}
                            {plan.carbTarget && ` · ${plan.carbTarget}g HC`}
                            {plan.fatTarget && ` · ${plan.fatTarget}g G`}
                        </span>
                    )}
                    <span>Creado por: {plan.professional.fullName}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <PlanDayCards mode="view" days={plan.days as any} />

                {plan.supplements && plan.supplements.length > 0 && (
                    <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50/50 p-3 space-y-2">
                        <p className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1.5">
                            Suplementos recomendados
                        </p>
                        <div className="space-y-2">
                            {plan.supplements.map((supp, i) => (
                                <div key={supp.id || i} className="text-sm">
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <span className="font-semibold text-purple-900">{supp.name}</span>
                                        {supp.dosage && (
                                            <span className="text-xs text-muted-foreground">{supp.dosage}</span>
                                        )}
                                        {supp.timing && (
                                            <span className="text-xs text-muted-foreground">· {supp.timing}</span>
                                        )}
                                        {supp.frequency && (
                                            <span className="text-xs text-muted-foreground">· {supp.frequency}</span>
                                        )}
                                    </div>
                                    {supp.notes && (
                                        <p className="text-xs text-muted-foreground italic mt-0.5">{supp.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {plan.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notas privadas</p>
                        <p className="text-sm">{plan.notes}</p>
                    </div>
                )}

                {plan.tips && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-xs font-medium text-amber-700 mb-1">Tips para el paciente</p>
                        <ul className="space-y-1">
                            {plan.tips.split("\n").filter((t) => t.trim()).map((tip, i) => (
                                <li key={i} className="text-sm text-amber-900">
                                    • {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
