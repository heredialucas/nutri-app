"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Eye,
    Pencil,
    Copy,
    Trash2,
    MoreVertical,
    CheckCircle,
    Archive,
    RotateCcw,
    Flame,
    Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
    setActivePlan,
    updateNutritionPlan,
    duplicateNutritionPlan,
    deleteNutritionPlan,
} from "@/app/actions/nutrition-plans";

interface Plan {
    id: string;
    title: string;
    description: string | null;
    status: string;
    calorieTarget: number | null;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    days: { meals: { foods: unknown[] }[] }[];
    patients: { patient: { id: string; firstName: string; lastName: string } }[];
}

const statusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    ARCHIVED: "Archivado",
};

function statusVariant(status: string) {
    if (status === "ACTIVE") return "default" as const;
    if (status === "DRAFT") return "secondary" as const;
    return "outline" as const;
}

function formatDate(value: string | null) {
    if (!value) return null;
    return new Date(value).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function PatientPlanHistory({
    patientId,
    plans,
}: {
    patientId: string;
    plans: Plan[];
}) {
    const router = useRouter();
    const [pending, setPending] = useState<{ planId: string; action: string } | null>(null);
    const [deletePlan, setDeletePlan] = useState<Plan | null>(null);

    const sorted = [...plans].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const totalFoods = (plan: Plan) =>
        plan.days.reduce(
            (acc, day) => acc + day.meals.reduce((a, m) => a + m.foods.length, 0),
            0
        );

    const run = async (
        planId: string,
        action: string,
        fn: () => Promise<unknown>,
        successMsg: string
    ) => {
        setPending({ planId, action });
        try {
            await fn();
            toast.success(successMsg);
            router.refresh();
        } catch {
            toast.error("Ocurrió un error, intentá nuevamente");
        } finally {
            setPending(null);
        }
    };

    const handleActivate = (plan: Plan) =>
        run(
            plan.id,
            "activate",
            () => setActivePlan(plan.id, patientId),
            "Plan activado para este paciente"
        );

    const handleArchive = (plan: Plan) =>
        run(
            plan.id,
            "archive",
            () => updateNutritionPlan(plan.id, { status: "ARCHIVED" }),
            "Plan archivado"
        );

    const handleDuplicate = async (plan: Plan) => {
        setPending({ planId: plan.id, action: "duplicate" });
        try {
            const copy = await duplicateNutritionPlan(plan.id);
            toast.success("Plan duplicado");
            router.push(`/dashboard/planes/${copy.id}/edit`);
        } catch {
            toast.error("Ocurrió un error al duplicar");
        } finally {
            setPending(null);
        }
    };

    const handleDelete = async () => {
        if (!deletePlan) return;
        const plan = deletePlan;
        setPending({ planId: plan.id, action: "delete" });
        try {
            await deleteNutritionPlan(plan.id);
            toast.success("Plan eliminado");
            setDeletePlan(null);
            router.refresh();
        } catch {
            toast.error("Ocurrió un error al eliminar");
        } finally {
            setPending(null);
        }
    };

    const isBusy = (planId: string) => pending?.planId === planId;

    return (
        <div className="space-y-3">
            {sorted.length === 0 ? (
                <div className="text-center py-10 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">
                        Este paciente todavía no tiene planes alimentarios.
                    </p>
                </div>
            ) : (
                sorted.map((plan, index) => {
                    const busy = isBusy(plan.id);
                    const planNumber = index + 1;
                    const startDate = formatDate(plan.startDate);
                    const foodCount = totalFoods(plan);

                    return (
                        <Card key={plan.id}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                                Plan {planNumber}
                                            </span>
                                            <Badge variant={statusVariant(plan.status)}>
                                                {statusLabels[plan.status] || plan.status}
                                            </Badge>
                                        </div>
                                        <p className="font-medium truncate mt-1">{plan.title}</p>
                                        {plan.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {plan.description}
                                            </p>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={busy}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleDuplicate(plan)}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Duplicar plan
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setDeletePlan(plan)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    {plan.calorieTarget && (
                                        <span className="inline-flex items-center gap-1">
                                            <Flame className="h-3 w-3" />
                                            {plan.calorieTarget} kcal/día
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {plan.days.length} día{plan.days.length !== 1 ? "s" : ""} ·{" "}
                                        {foodCount} alimento{foodCount !== 1 ? "s" : ""}
                                    </span>
                                    {startDate && <span>Inicio: {startDate}</span>}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/planes/${plan.id}`}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            Ver
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/planes/${plan.id}/edit`}>
                                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                            Editar
                                        </Link>
                                    </Button>
                                    {plan.status === "DRAFT" && (
                                        <Button size="sm" disabled={busy} onClick={() => handleActivate(plan)}>
                                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                            Publicar
                                        </Button>
                                    )}
                                    {plan.status === "ACTIVE" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() => handleArchive(plan)}
                                        >
                                            <Archive className="mr-1.5 h-3.5 w-3.5" />
                                            Archivar
                                        </Button>
                                    )}
                                    {plan.status === "ARCHIVED" && (
                                        <Button size="sm" disabled={busy} onClick={() => handleActivate(plan)}>
                                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                            Reactivar
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}

            <AlertDialog
                open={!!deletePlan}
                onOpenChange={(open) => !open && setDeletePlan(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el plan y toda su
                            estructura de días, comidas y alimentos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending?.action === "delete"}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={pending?.action === "delete"}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}