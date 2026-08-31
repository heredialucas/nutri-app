import type { GeneratedMealPlan, GeneratedDay } from "./meal-plan-generator";

export interface PlanChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface PlanChatContext {
    plan: GeneratedMealPlan;
    patientContext?: string;
    originalOptions?: string;
}

export interface PlanToolCall {
    name: string;
    arguments: Record<string, unknown>;
    call_id: string;
}

export interface PlanPatch {
    title?: string;
    description?: string;
    calorieTarget?: number;
    notes?: string;
    tips?: string;
    dailyCalories?: number;
    dailyProtein?: number;
    dailyCarbs?: number;
    dailyFat?: number;
    days?: GeneratedDay[];
    supplements?: GeneratedMealPlan["supplements"];
}

function findDayIndex(plan: GeneratedMealPlan, dayLabel: string): number {
    const lower = dayLabel.toLowerCase().trim();
    return plan.days.findIndex((d) => {
        const dl = d.label.toLowerCase();
        return dl.includes(lower) || lower.includes(dl);
    });
}

function findMealIndex(day: GeneratedDay, mealLabel: string): number {
    const lower = mealLabel.toLowerCase().trim();
    return day.meals.findIndex((m) => {
        const ml = m.label.toLowerCase();
        return ml.includes(lower) || lower.includes(ml);
    });
}

export function applyPlanPatch(plan: GeneratedMealPlan, patch: PlanPatch): GeneratedMealPlan {
    const next: GeneratedMealPlan = { ...plan };

    if (patch.title !== undefined) next.title = patch.title;
    if (patch.description !== undefined) next.description = patch.description;
    if (patch.calorieTarget !== undefined) next.calorieTarget = patch.calorieTarget;
    if (patch.tips !== undefined) next.tips = patch.tips;
    if (patch.dailyCalories !== undefined) next.dailyCalories = patch.dailyCalories;
    if (patch.dailyProtein !== undefined) next.dailyProtein = patch.dailyProtein;
    if (patch.dailyCarbs !== undefined) next.dailyCarbs = patch.dailyCarbs;
    if (patch.dailyFat !== undefined) next.dailyFat = patch.dailyFat;
    if (patch.supplements !== undefined) next.supplements = patch.supplements;

    if (patch.days !== undefined && Array.isArray(patch.days)) next.days = patch.days;

    return next;
}

export function buildPlanChatSystemPrompt(ctx: PlanChatContext): string {
    const planJson = JSON.stringify({ ...ctx.plan, notes: "" }, null, 2);

    const patientSection = ctx.patientContext
        ? `\n\nCONTEXTO DEL PACIENTE:\n${ctx.patientContext}`
        : "";

    const optionsSection = ctx.originalOptions
        ? `\n\nOPCIONES ORIGINALES DEL PLAN:\n${ctx.originalOptions}`
        : "";

    const prompt = `Sos un asistente de nutrición especializado en modificar planes alimentarios. Tu único trabajo es traducir los pedidos del profesional en cambios precisos sobre el plan actual.

REGLAS ESTRICTAS:
- NO escribas ningún texto. NO expliques tu proceso, NO muestres JSON, NO digas "voy a proceder", NO agregues comentarios. Tu ÚNICA salida debe ser una única tool call "apply_plan_update".
 - Solo modificá lo que el profesional pidió. No toques nada más.
- Aunque la tool se llame "apply_plan_update", siempre tenés que devolver el plan COMPLETO actualizado: todos sus días, todas sus comidas y todos sus alimentos. Conservá literalmente todo lo que no fue solicitado.
- No devuelvas fragmentos ni parches parciales. La respuesta debe incluir también los días y comidas que no cambiaron.
- Conservá la misma cantidad de días y la misma estructura del plan actual. No agregues, elimines ni reorganices días o comidas salvo que el profesional lo pida explícitamente.
- Respetá TODAS las alergias e intolerancias del paciente. Considerá interacciones medicamento-nutriente.
- Calculá y enviá los macros (calories/protein/carbs/fat) según los alimentos y porciones elegidos. No agregues alimentos ni cambies porciones no solicitadas para alcanzar una meta calórica.
- Usá unidades métricas (g, ml). Porciones realistas y específicas.
- Si el pedido menciona un día o comida, ubicálo por su "dayOrder" y "mealOrder" del plan actual.

 La tool debe contener el plan completo actualizado, no un fragmento. La estructura esperada es:
{
  "days": [
    {
      "dayOrder": <número del día>,
      "meals": [
        {
          "mealOrder": <número de la comida>,
          "label": "Nombre de la comida",
          "foods": [ { "name": "...", "quantity": "...", "unit": "...", "calories": N, "protein": N, "carbs": N, "fat": N } ]
        }
      ]
    }
  ]
}

Recordá: SOLO la tool call, sin texto.${patientSection}${optionsSection}`;

    return `${prompt}\n\nPLAN ACTUAL COMPLETO (las notas privadas están excluidas y no deben generarse):\n${planJson}`;
}

export function buildPlanChatTools(): Array<{
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}> {
    return [
        {
            type: "function",
            function: {
                name: "apply_plan_update",
                description: "Reemplaza el plan actual por su versión completa actualizada. Conservá literalmente todo lo que no fue solicitado y no incluyas notas privadas.",
                parameters: {
                    type: "object",
                    properties: {
                        title: { type: "string", description: "Nuevo título del plan" },
                        description: { type: "string", description: "Nueva descripción del plan" },
                        calorieTarget: { type: "number", description: "Nueva meta calórica diaria" },
                        tips: { type: "string", description: "Tips de nutrición actualizados" },
                        dailyCalories: { type: "number", description: "Calorías diarias promedio" },
                        dailyProtein: { type: "number", description: "Gramos de proteína diarios" },
                        dailyCarbs: { type: "number", description: "Gramos de carbohidratos diarios" },
                        dailyFat: { type: "number", description: "Gramos de grasas diarias" },
                        days: {
                            type: "array",
                            description: "Array COMPLETO de todos los días actuales con todos los cambios aplicados",
                            items: {
                                type: "object",
                                properties: {
                                    dayOrder: { type: "number" },
                                    label: { type: "string" },
                                    meals: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                label: { type: "string" },
                                                mealOrder: { type: "number" },
                                                calories: { type: "number" },
                                                protein: { type: "number" },
                                                carbs: { type: "number" },
                                                fat: { type: "number" },
                                                notes: { type: "string" },
                                                foods: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            name: { type: "string" },
                                                            quantity: { type: "string" },
                                                            unit: { type: "string" },
                                                            notes: { type: "string" },
                                                            calories: { type: "number" },
                                                            protein: { type: "number" },
                                                            carbs: { type: "number" },
                                                            fat: { type: "number" },
                                                        },
                                                        required: ["name"],
                                                    },
                                                },
                                            },
                                            required: ["label", "mealOrder", "foods"],
                                        },
                                    },
                                },
                                required: ["dayOrder", "label", "meals"],
                            },
                        },
                        supplements: {
                            type: "array",
                            description: "Lista completa de suplementos actualizada",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    dosage: { type: "string" },
                                    timing: { type: "string" },
                                    frequency: { type: "string" },
                                    notes: { type: "string" },
                                },
                                required: ["name"],
                            },
                        },
                    },
                    required: ["title", "description", "calorieTarget", "dailyCalories", "dailyProtein", "dailyCarbs", "dailyFat", "days", "supplements"],
                },
            },
        },
    ];
}

export function normalizePlanPatch(patch: PlanPatch, _currentPlan: GeneratedMealPlan): PlanPatch {
    // La IA calcula y devuelve los valores nutricionales; acá no se alteran.
    return patch;
}
