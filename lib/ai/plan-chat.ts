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

    const prompt = `Sos un asistente de nutrición que ayuda a un profesional a editar planes alimentarios. Priorizá la coherencia nutricional, la seguridad del paciente y la fidelidad al pedido. No reemplazás el criterio clínico del profesional.

REGLAS ESTRICTAS:
- Si el pedido es claro y seguro, usá una única tool call "apply_plan_update". Si falta información esencial, hay ambigüedad sobre qué comida modificar o no podés proponer una alternativa razonable, NO modifiques el plan: hacé una pregunta breve en texto y no uses la tool.
- Modificá únicamente lo solicitado y los datos que necesariamente dependen de ese cambio. Conservá literalmente el resto.
- Aunque la tool se llame "apply_plan_update", devolvé el plan COMPLETO actualizado: todos sus días, comidas y alimentos, incluidos los que no cambiaron.
- No devuelvas fragmentos ni parches parciales. La respuesta debe incluir también los días y comidas que no cambiaron.
- Conservá la misma cantidad de días y la misma estructura del plan actual. No agregues, elimines ni reorganices días o comidas salvo que el profesional lo pida explícitamente.
- Respetá todas las alergias, intolerancias y restricciones conocidas. No recomiendes cambios que contradigan el contexto clínico; si hay un riesgo o una interacción relevante, no apliques el cambio y pedí revisión del profesional.
- Cuando agregues, sustituyas o cambies la cantidad de un alimento, actualizá SIEMPRE en ese alimento: cantidad, unidad, equivalencia, calorías, proteína, carbohidratos y grasas. No reutilices la equivalencia anterior si ya no representa la nueva cantidad o alimento.
- La equivalencia debe ser una medida casera realista y corresponder a la cantidad exacta indicada (por ejemplo, "150 g de manzana" ≈ "1 unidad mediana"; no inventes equivalencias universales para alimentos cuya densidad o preparación cambie mucho). Aclará si la cantidad es en crudo, cocido, escurrido o lista para consumir cuando eso afecte significativamente el cálculo.
- Expresá cantidades concretas y unidades claras (preferentemente g/ml; unidades, cucharadas o tazas solo cuando sean apropiadas). No confundas peso crudo con cocido ni una porción individual con el total de la receta.
- Estimá kcal y macros de forma consistente con el alimento, la cantidad y su estado de preparación. No inventes una precisión que no tenés: si faltan datos determinantes para una estimación segura, pedí aclaración y no uses la tool.
- Para cada comida modificada, recalculá las kcal, proteína, carbohidratos y grasas totales como suma de sus alimentos. Después recalculá los promedios diarios del plan a partir de los totales de todas las comidas de todos los días. Nunca dejes los totales anteriores si cambiaron sus componentes.
- Si el profesional pide reemplazar una comida o plato por una alternativa "equivalente", usá los valores originales de esa comida como referencia y procurá mantener sus kcal y macros en un margen razonable (aprox. ±10%), sin alterar otras comidas. Si solicita un objetivo distinto, seguí ese objetivo explícito.
- No cambies la meta "calorieTarget" ni los objetivos del paciente por iniciativa propia. Tampoco agregues alimentos o cambies porciones que no fueron solicitados para forzar que el plan alcance una meta.
- Si una comida cambia, actualizá también su "title" para que describa el plato resultante; si no cambia, conservá su título.
- Conservá y, si es necesario, actualizá el campo "title" de cada comida: es el nombre corto del plato o preparación principal (ej. "Fajitas integrales rellenas"). Si falta, generá uno breve (2 a 6 palabras) a partir de los alimentos.
- Si el pedido menciona un día o comida, identificalo por "dayOrder" y "mealOrder"; no elijas otra comida por similitud del nombre.

La tool debe contener el plan completo actualizado, no un fragmento. La estructura esperada es:
{
  "days": [
    {
      "dayOrder": <número del día>,
      "meals": [
        {
          "mealOrder": <número de la comida>,
          "label": "Nombre de la comida",
          "title": "Nombre corto del plato o preparación principal",
          "foods": [ { "name": "...", "quantity": "...", "unit": "...", "equivalence": "...", "calories": N, "protein": N, "carbs": N, "fat": N } ]
        }
      ]
    }
  ]
}

Recordá: tool call si podés aplicar el cambio con seguridad; si falta información esencial, preguntá brevemente y no modifiques el plan.${patientSection}${optionsSection}`;

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
                                                title: { type: "string", description: "Nombre corto del plato o preparación principal de la comida (ej. Fajitas integrales rellenas)" },
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
                                                            equivalence: { type: "string", description: "Medida casera equivalente a la cantidad (ej: 1 vaso, 1 unidad mediana, 4 cucharadas)" },
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

const NUTRIENT_FIELDS = ["calories", "protein", "carbs", "fat"] as const;
type NutrientField = (typeof NUTRIENT_FIELDS)[number];

function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function sumFoods(meal: GeneratedDay["meals"][number], field: NutrientField): number | null {
    if (!meal.foods.length || meal.foods.some((food) => !Number.isFinite(food[field]) || food[field]! < 0)) {
        return null;
    }
    const sum = meal.foods.reduce((total, food) => total + food[field]!, 0);
    return field === "calories" ? Math.round(sum) : roundTo(sum, 1);
}

function findMatchingMeal(
    plan: GeneratedMealPlan,
    dayOrder: number,
    mealOrder: number,
): GeneratedDay["meals"][number] | undefined {
    return plan.days.find((day) => day.dayOrder === dayOrder)?.meals.find((meal) => meal.mealOrder === mealOrder);
}

function validateChangedMeal(
    meal: GeneratedDay["meals"][number],
    dayLabel: string,
): void {
    if (!meal.foods.length) {
        throw new Error(`La comida ${dayLabel} / ${meal.label} quedó sin alimentos. No se aplicó ningún cambio.`);
    }

    for (const food of meal.foods) {
        if (!food.name?.trim() || !food.quantity?.trim() || !food.unit?.trim() || !food.equivalence?.trim()) {
            throw new Error(`Faltan alimento, cantidad, unidad o equivalencia en ${dayLabel} / ${meal.label}. No se aplicó ningún cambio.`);
        }
        for (const field of NUTRIENT_FIELDS) {
            if (!Number.isFinite(food[field]) || food[field]! < 0) {
                throw new Error(`Faltan kcal o macros válidos para "${food.name}" en ${dayLabel} / ${meal.label}. No se aplicó ningún cambio.`);
            }
        }

        // Detecta errores graves de escala sin rechazar diferencias normales por fibra,
        // redondeos, marcas o variaciones de preparación.
        const macroCalories = 4 * food.protein! + 4 * food.carbs! + 9 * food.fat!;
        const calorieDifference = Math.abs(food.calories! - macroCalories);
        if (calorieDifference > Math.max(50, food.calories! * 0.5)) {
            throw new Error(`Las kcal y los macros de "${food.name}" parecen incompatibles en ${dayLabel} / ${meal.label}. No se aplicó ningún cambio.`);
        }
    }
}

export function normalizePlanPatch(patch: PlanPatch, currentPlan: GeneratedMealPlan): PlanPatch {
    if (!patch.days) return patch;

    const days = patch.days.map((day) => ({
        ...day,
        meals: day.meals.map((meal) => ({ ...meal, foods: meal.foods.map((food) => ({ ...food })) })),
    }));

    for (const day of days) {
        for (const meal of day.meals) {
            const previousMeal = findMatchingMeal(currentPlan, day.dayOrder, meal.mealOrder);
            const foodsChanged = !previousMeal || JSON.stringify(previousMeal.foods) !== JSON.stringify(meal.foods);

            if (foodsChanged) validateChangedMeal(meal, day.label);

            // Los totales de una comida con cambios en sus alimentos siempre se derivan
            // de esos alimentos; no confiamos en totales duplicados calculados por la IA.
            if (foodsChanged) {
                for (const field of NUTRIENT_FIELDS) {
                    const total = sumFoods(meal, field);
                    if (total === null) {
                        throw new Error(`No se pudieron calcular los totales de ${day.label} / ${meal.label}. No se aplicó ningún cambio.`);
                    }
                    meal[field] = total;
                }
            }
        }
    }

    const averageFor = (field: NutrientField): number | null => {
        const dayTotals: number[] = [];
        for (const day of days) {
            const mealTotals = day.meals.map((meal) => meal[field]);
            if (mealTotals.some((value) => !Number.isFinite(value) || value! < 0)) return null;
            dayTotals.push(mealTotals.reduce<number>((sum, value) => sum + value!, 0));
        }
        if (!dayTotals.length) return null;
        const average = dayTotals.reduce((sum, value) => sum + value, 0) / dayTotals.length;
        return field === "calories" ? Math.round(average) : roundTo(average, 1);
    };

    const next: PlanPatch = { ...patch, days };
    const dailyCalories = averageFor("calories");
    const dailyProtein = averageFor("protein");
    const dailyCarbs = averageFor("carbs");
    const dailyFat = averageFor("fat");
    if (dailyCalories !== null) next.dailyCalories = dailyCalories;
    if (dailyProtein !== null) next.dailyProtein = dailyProtein;
    if (dailyCarbs !== null) next.dailyCarbs = dailyCarbs;
    if (dailyFat !== null) next.dailyFat = dailyFat;

    return next;
}
