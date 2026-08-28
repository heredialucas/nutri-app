import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { patientService } from "@/services/patient-service";
import { nutritionPlanService } from "@/services/nutrition-plan-service";
import { shoppingListService } from "@/services/shopping-list-service";
import { UtensilsCrossed, ShoppingCart, BookOpen, Lightbulb, ChevronDown, ChevronRight, Pill } from "lucide-react";
import Link from "next/link";

export default async function PlanPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (!isPatientUser(user)) redirect("/dashboard");

    const patient = await patientService.getByUserId(user.id);
    if (!patient) redirect("/auth/login");

    const [activePlan, allPlans, shoppingLists] = await Promise.all([
        nutritionPlanService.getActiveForPatient(patient.id),
        nutritionPlanService.list({ patientId: patient.id }),
        shoppingListService.list({ patientId: patient.id }),
    ]);

    const planRecipes = activePlan?.recipes ?? [];
    const planTips = (activePlan?.tips ?? "")
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">Mi plan alimentario</h1>
            <p className="text-sm text-[#666] mb-6 m-0">Tu alimentación personalizada</p>

            {/* Active Plan */}
            {activePlan ? (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <h2 className="text-sm font-semibold text-[#1a1a1a] m-0 uppercase tracking-wide">
                            Plan activo
                        </h2>
                    </div>

                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white mb-4">
                        <h3 className="text-base font-semibold text-[#1a1a1a] m-0 mb-1">{activePlan.title}</h3>
                        {activePlan.description && (
                            <p className="text-sm text-[#666] m-0 mb-3">{activePlan.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                                            {activePlan.calorieTarget && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.03)] text-[#666]">
                                                    {activePlan.calorieTarget} kcal/día
                                                </span>
                                            )}
                                            {activePlan.proteinTarget && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.03)] text-[#666]">
                                                    {activePlan.proteinTarget}g P
                                                </span>
                                            )}
                                            {activePlan.carbTarget && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.03)] text-[#666]">
                                                    {activePlan.carbTarget}g HC
                                                </span>
                                            )}
                                            {activePlan.fatTarget && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.03)] text-[#666]">
                                                    {activePlan.fatTarget}g G
                                                </span>
                                            )}
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.03)] text-[#666]">
                                {activePlan.days?.length || 0} días
                            </span>
                            {activePlan.startDate && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.03)] text-[#666]">
                                    Desde {new Date(activePlan.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                                </span>
                            )}
                        </div>

                        {/* Days & Meals */}
                        {activePlan.days && activePlan.days.length > 0 && (
                            <div className="space-y-3">
                                {activePlan.days.map((day: any) => (
                                    <details key={day.id} className="group">
                                        <summary className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg hover:bg-[rgba(0,0,0,0.02)] transition-colors list-none">
                                            <span className="text-sm font-medium text-[#1a1a1a]">
                                                {day.label}
                                            </span>
                                            <span className="text-xs text-[#999] group-open:hidden">
                                                <ChevronRight size={14} />
                                            </span>
                                            <span className="text-xs text-[#999] hidden group-open:block">
                                                <ChevronDown size={14} />
                                            </span>
                                        </summary>
                                        <div className="pl-3 pb-2">
                                            {day.meals?.map((meal: any) => (
                                                <div key={meal.id} className="py-2 border-l-2 border-[rgba(0,0,0,0.06)] pl-3 ml-1 mb-1">
                                                    <p className="text-xs font-semibold text-[#1a1a1a] m-0 mb-1.5 uppercase tracking-wide">
                                                        {meal.label}
                                                    </p>
                                                    {meal.notes && (
                                                        <p className="text-xs italic text-[#854d0e] bg-[#fef9c3] border border-[rgba(234,179,8,0.2)] rounded-md px-2 py-1.5 m-0 mb-1.5">
                                                            {meal.notes}
                                                        </p>
                                                    )}
                                                    <div className="space-y-1">
                                                        {meal.foods?.map((food: any) => (
                                                            <div key={food.id} className="flex items-baseline gap-2 text-sm">
                                                                <span className="text-[#1a1a1a]">{food.name}</span>
                                                                {(food.quantity || food.unit) && (
                                                                    <span className="text-xs text-[#999]">
                                                                        {food.quantity}{food.unit ? ` ${food.unit}` : ""}
                                                                    </span>
                                                                )}
                                                                {food.notes && (
                                                                    <span className="text-xs text-[#999] italic">— {food.notes}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}

                        {activePlan.supplements && activePlan.supplements.length > 0 && (
                            <div className="mt-4 p-3 rounded-lg border border-[rgba(168,85,247,0.2)] bg-[#faf5ff]">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Pill size={14} className="text-[#9333ea]" />
                                    <p className="text-xs font-semibold text-[#6b21a8] m-0 uppercase tracking-wide">
                                        Suplementos
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {activePlan.supplements.map((supp: any, idx: number) => (
                                        <div key={supp.id || idx} className="text-sm">
                                            <div className="flex flex-wrap items-baseline gap-x-2">
                                                <span className="font-medium text-[#1a1a1a]">{supp.name}</span>
                                                {supp.dosage && <span className="text-xs text-[#999]">{supp.dosage}</span>}
                                                {supp.timing && <span className="text-xs text-[#999]">· {supp.timing}</span>}
                                                {supp.frequency && <span className="text-xs text-[#999]">· {supp.frequency}</span>}
                                            </div>
                                            {supp.notes && (
                                                <p className="text-xs text-[#666] italic mt-0.5 m-0">{supp.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activePlan.notes && (
                            <div className="mt-4 p-3 rounded-lg bg-[#fef9c3] border border-[rgba(234,179,8,0.2)]">
                                <p className="text-xs text-[#854d0e] m-0">
                                    <strong>Nota del profesional:</strong> {activePlan.notes}
                                </p>
                            </div>
                        )}

                        {activePlan.pdfUrl && (
                            <a
                                href={activePlan.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-4 text-sm text-[#1a1a1a] font-medium underline underline-offset-4 hover:text-[#666]"
                            >
                                Descargar PDF del plan
                            </a>
                        )}
                    </div>
                </section>
            ) : (
                <div className="text-center py-12 mb-8">
                    <UtensilsCrossed size={36} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-[#1a1a1a] mb-1 m-0">
                        Sin plan activo
                    </h2>
                    <p className="text-sm text-[#666] m-0">
                        Mauro Acosta te asignará tu plan alimentario pronto.
                    </p>
                </div>
            )}

            {/* Shopping Lists */}
            {shoppingLists.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart size={16} className="text-[#1a1a1a]" />
                        <h2 className="text-sm font-semibold text-[#1a1a1a] m-0 uppercase tracking-wide">
                            Listas de compras
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {shoppingLists.map((list: any) => (
                            <details key={list.id} className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors list-none">
                                    <div>
                                        <span className="text-sm font-medium text-[#1a1a1a] block">{list.title}</span>
                                        <span className="text-xs text-[#999]">{list.items?.length || 0} productos</span>
                                    </div>
                                    <span className="text-xs text-[#999] group-open:hidden">
                                        <ChevronRight size={14} />
                                    </span>
                                    <span className="text-xs text-[#999] hidden group-open:block">
                                        <ChevronDown size={14} />
                                    </span>
                                </summary>
                                <div className="mt-1 p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                    <ul className="space-y-1.5 m-0 p-0 list-none">
                                        {list.items?.map((item: any) => (
                                            <li key={item.id} className="flex items-center gap-2 text-sm">
                                                <span className="w-4 h-4 rounded border border-[rgba(0,0,0,0.12)] shrink-0" />
                                                <span className="text-[#1a1a1a]">{item.name}</span>
                                                {(item.quantity || item.unit) && (
                                                    <span className="text-xs text-[#999]">
                                                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* Recipes */}
            {planRecipes.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={16} className="text-[#1a1a1a]" />
                        <h2 className="text-sm font-semibold text-[#1a1a1a] m-0 uppercase tracking-wide">
                            Recetas recomendadas
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {planRecipes.map((recipe: any) => (
                            <details key={recipe.id} className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors list-none">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-[#1a1a1a] block">{recipe.title}</span>
                                        {recipe.description && (
                                            <span className="text-xs text-[#999] line-clamp-1">{recipe.description}</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-[#999] group-open:hidden shrink-0 ml-2">
                                        <ChevronRight size={14} />
                                    </span>
                                    <span className="text-xs text-[#999] hidden group-open:block shrink-0 ml-2">
                                        <ChevronDown size={14} />
                                    </span>
                                </summary>
                                <div className="mt-1 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white space-y-3">
                                    {recipe.ingredients && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#1a1a1a] m-0 mb-1 uppercase tracking-wide">Ingredientes</p>
                                            <p className="text-sm text-[#666] m-0 whitespace-pre-line">{recipe.ingredients}</p>
                                        </div>
                                    )}
                                    {recipe.instructions && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#1a1a1a] m-0 mb-1 uppercase tracking-wide">Preparación</p>
                                            <p className="text-sm text-[#666] m-0 whitespace-pre-line">{recipe.instructions}</p>
                                        </div>
                                    )}
                                    {recipe.imageUrl && (
                                        <img
                                            src={recipe.imageUrl}
                                            alt={recipe.title}
                                            className="w-full max-w-xs rounded-lg mt-2"
                                        />
                                    )}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* Nutrition Tips */}
            {planTips.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-[#eab308]" />
                        <h2 className="text-sm font-semibold text-[#1a1a1a] m-0 uppercase tracking-wide">
                            Tips de nutrición
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {planTips.map((tip, i) => (
                            <div key={i} className="p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                <p className="text-sm text-[#1a1a1a] m-0">{tip}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Past Plans */}
            {allPlans.length > 1 && (
                <section className="mb-8">
                    <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3 m-0 uppercase tracking-wide">
                        Planes anteriores
                    </h2>
                    <div className="space-y-2">
                        {allPlans.filter((p: any) => p.id !== activePlan?.id).map((plan: any) => (
                            <div key={plan.id} className="p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white opacity-70">
                                <span className="text-sm text-[#1a1a1a] block">{plan.title}</span>
                                <span className="text-xs text-[#999]">
                                    {plan.status === "ARCHIVED" ? "Archivado" : plan.status}
                                    {plan.startDate && ` · ${new Date(plan.startDate).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

