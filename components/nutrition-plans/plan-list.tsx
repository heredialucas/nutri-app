"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";

interface Plan {
    id: string;
    title: string;
    description: string | null;
    status: string;
    calorieTarget: number | null;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    patient: { id: string; firstName: string; lastName: string };
    professional: { id: string; fullName: string };
    days: {
        meals: {
            foods: { id: string }[];
        }[];
    }[];
}

export function PlanList({ initialPlans }: { initialPlans: Plan[] }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "DRAFT" | "ACTIVE" | "ARCHIVED">("all");

    const filtered = initialPlans.filter((p) => {
        const matchesSearch =
            !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === "all" || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    const statusLabels: Record<string, string> = {
        DRAFT: "Borrador",
        ACTIVE: "Activo",
        ARCHIVED: "Archivado",
    };

    const totalFoods = (plan: Plan) =>
        plan.days.reduce((acc, day) => acc + day.meals.reduce((a, m) => a + m.foods.length, 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título o paciente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => (
                        <Button
                            key={s}
                            variant={filter === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(s)}
                        >
                            {s === "all" ? "Todos" : statusLabels[s]}
                        </Button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {search ? "No se encontraron planes con esa búsqueda" : "No hay planes alimentarios creados"}
                    </p>
                    {!search && (
                        <Button asChild className="mt-4">
                            <Link href="/dashboard/planes/new">
                                <FileText className="mr-2 h-4 w-4" />
                                Crear plan
                            </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((plan) => (
                        <Link
                            key={plan.id}
                            href={`/dashboard/planes/${plan.id}`}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{plan.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{plan.patient.firstName} {plan.patient.lastName}</span>
                                        <span>·</span>
                                        <span>{plan.days.length} día{plan.days.length !== 1 ? "s" : ""}</span>
                                        <span>·</span>
                                        <span>{totalFoods(plan)} alimento{totalFoods(plan) !== 1 ? "s" : ""}</span>
                                        {plan.calorieTarget && (
                                            <>
                                                <span>·</span>
                                                <span>{plan.calorieTarget} kcal</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="hidden sm:inline text-xs text-muted-foreground">
                                    {plan.professional.fullName}
                                </span>
                                <Badge
                                    variant={
                                        plan.status === "ACTIVE"
                                            ? "default"
                                            : plan.status === "DRAFT"
                                            ? "secondary"
                                            : "outline"
                                    }
                                >
                                    {statusLabels[plan.status] || plan.status}
                                </Badge>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
