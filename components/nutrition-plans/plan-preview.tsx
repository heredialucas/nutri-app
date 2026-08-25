"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PlanData {
    id: string;
    title: string;
    description: string | null;
    status: string;
    calorieTarget: number | null;
    notes: string | null;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    patient: { firstName: string; lastName: string };
    professional: { fullName: string };
    days: {
        id?: string;
        dayOrder: number;
        label: string;
        meals: {
            id?: string;
            label: string;
            mealOrder: number;
            foods: {
                id?: string;
                name: string;
                quantity: string | null;
                unit: string | null;
                notes: string | null;
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
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{plan.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Para: {plan.patient.firstName} {plan.patient.lastName}
                        </p>
                        {plan.description && (
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
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
                    {plan.calorieTarget && <span>Meta: {plan.calorieTarget} kcal</span>}
                    <span>Creado por: {plan.professional.fullName}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {plan.days.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                        Este plan no tiene días configurados aún
                    </p>
                ) : (
                    plan.days.map((day) => (
                        <div key={day.id || day.dayOrder} className="space-y-3">
                            <h3 className="font-semibold text-lg border-b pb-2">
                                {day.label}
                            </h3>
                            {day.meals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Sin comidas configuradas</p>
                            ) : (
                                day.meals.map((meal) => (
                                    <div key={meal.id || meal.mealOrder} className="pl-4 space-y-2">
                                        <h4 className="font-medium text-base">{meal.label}</h4>
                                        {meal.foods.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Sin alimentos</p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {meal.foods.map((food) => (
                                                    <li
                                                        key={food.id}
                                                        className="flex items-baseline gap-2 text-sm"
                                                    >
                                                        <span className="font-medium">{food.name}</span>
                                                        {food.quantity && (
                                                            <span className="text-muted-foreground">
                                                                {food.quantity}
                                                                {food.unit ? ` ${food.unit}` : ""}
                                                            </span>
                                                        )}
                                                        {food.notes && (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                ({food.notes})
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {meal.mealOrder < day.meals.length && <Separator className="my-2" />}
                                    </div>
                                ))
                            )}
                        </div>
                    ))
                )}

                {plan.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notas privadas</p>
                        <p className="text-sm">{plan.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
