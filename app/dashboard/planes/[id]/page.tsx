import { getNutritionPlanById } from "@/app/actions/nutrition-plans";
import { getPatients } from "@/app/actions/patients";
import { PlanPreview } from "@/components/nutrition-plans/plan-preview";
import { PlanActions } from "@/components/nutrition-plans/plan-actions";
import { AssignPlanPatients } from "@/components/nutrition-plans/assign-plan-patients";
import { PlanRecipes } from "@/components/nutrition-plans/plan-recipes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil, ChefHat, UserPlus } from "lucide-react";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanExportButton } from "@/components/nutrition-plans/plan-export-button";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const plan = await getNutritionPlanById(id).catch(() => null);
    const patients = (plan as any)?.patients?.map((p: any) => p.patient) ?? [];
    const names = patients.map((p: any) => `${p.firstName} ${p.lastName}`).join(", ") || "Sin asignar";
    return {
        title: plan?.title || "Plan alimentario",
        description: `Plan de alimentación para ${names}`,
    };
}

export default async function PlanDetailPage({ params }: Props) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const { id } = await params;
    let plan;
    try {
        plan = await getNutritionPlanById(id);
    } catch {
        notFound();
    }

    if (!plan) notFound();

    const patients = await getPatients();
    const planPatients = (plan as any)?.patients?.map((p: any) => p.patient) ?? [];
    const patientIds = (plan as any)?.patients?.map((p: any) => p.patientId) ?? [];
    const names = planPatients.map((p: any) => `${p.firstName} ${p.lastName}`).join(", ");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/planes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{plan.title}</h1>
                        <p className="text-muted-foreground text-sm">
                            {names || <span className="italic">Sin pacientes asignados</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AssignPlanPatients
                        planId={plan.id}
                        patients={(patients as any[]).map((p) => ({
                            id: p.id,
                            firstName: p.firstName,
                            lastName: p.lastName,
                        }))}
                        selectedIds={patientIds}
                    />
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/planes/${plan.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                    <PlanExportButton
                        variant="outline"
                        label="Exportar PDF"
                        data={{
                            title: plan.title,
                            description: plan.description,
                            patientName: names || "Paciente",
                            professionalName: user.fullName || "Mauro Acosta",
                            calorieTarget: plan.calorieTarget,
                            proteinTarget: plan.proteinTarget,
                            carbTarget: plan.carbTarget,
                            fatTarget: plan.fatTarget,
                            notes: plan.notes,
                            tips: plan.tips,
                            startDate: plan.startDate,
                            days: (plan.days || []).map((d: any) => ({
                                label: d.label,
                                meals: (d.meals || []).map((m: any) => ({
                                    label: m.label,
                                    notes: m.notes,
                                    foods: (m.foods || []).map((f: any) => ({
                                        name: f.name,
                                        quantity: f.quantity,
                                        unit: f.unit,
                                        notes: f.notes,
                                    })),
                                })),
                            })),
                            supplements: (plan.supplements || []).map((s: any) => ({
                                name: s.name,
                                dosage: s.dosage,
                                timing: s.timing,
                                frequency: s.frequency,
                                notes: s.notes,
                            })),
                            recipes: (plan.recipes || []).map((r: any) => ({
                                title: r.title,
                                ingredients: r.ingredients,
                                instructions: r.instructions,
                            })),
                        }}
                    />
                    <PlanActions
                        planId={plan.id}
                        planStatus={plan.status}
                        patientIds={patientIds}
                    />
                </div>
            </div>
            <PlanPreview plan={plan as any} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-muted-foreground" />
                        Recetas del plan
                    </CardTitle>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/recetas">
                            Ver todas las recetas
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <PlanRecipes recipes={(plan as any).recipes ?? []} />
                </CardContent>
            </Card>
        </div>
    );
}
