import OpenAI from "openai";
import { extractJsonFromResponse } from "./extract-json";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedShoppingList {
    title: string;
    items: {
        name: string;
        quantity: string;
        unit: string;
    }[];
}

const SHOPPING_LIST_SYSTEM_PROMPT = `Sos un profesional de nutrición experto en planificación de compras. Tu rol es generar listas de compras organizadas y completas para pacientes.

Reglas:
- Agrupá alimentos por categoría (frutas, verduras, carnes, lácteos, granos, etc.)
- Incluí cantidades precisas
- Usá unidades métricas (g, ml, unidades)
- Evitá duplicados, consolidá cantidades
- Incluí alternativas cuando sea apropiado
- Respondé SOLO con JSON válido`;

export async function generateShoppingListFromPrompt(prompt: string, patientContext?: string): Promise<GeneratedShoppingList> {
    const userPrompt = `Generá una lista de compras con la siguiente descripción: "${prompt}"
${patientContext ? `\nContexto del paciente:\n${patientContext}` : ""}

Respondé con JSON con esta estructura exacta:
{
  "title": "Título de la lista",
  "items": [
    { "name": "Nombre del alimento", "quantity": "cantidad", "unit": "unidad" }
  ]
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-5.6-luna",
        messages: [
            { role: "system", content: SHOPPING_LIST_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 16000,
        response_format: { type: "json_object" },
    });

    const content = extractJsonFromResponse(completion.choices[0]?.message as any);
    if (!content) throw new Error("La IA no devolvió una respuesta válida");

    const parsed = JSON.parse(content) as GeneratedShoppingList;
    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error("La respuesta de la IA no tiene la estructura esperada");
    }
    return parsed;
}

export async function generateShoppingListFromMealPlan(
    mealPlanData: { title: string; days: { meals: { foods: { name: string; quantity: string; unit: string }[] }[] }[] }
): Promise<GeneratedShoppingList> {
    const allFoods = mealPlanData.days
        .flatMap((day) => day.meals.flatMap((meal) => meal.foods))
        .map((f) => `${f.name} - ${f.quantity} ${f.unit}`)
        .join("\n");

    const userPrompt = `A partir de los alimentos del siguiente plan alimentario, generá una lista de compras consolidada y organizada por categorías.

ALIMENTOS DEL PLAN:
${allFoods}

Respondé con JSON con esta estructura exacta:
{
  "title": "Lista de compras - ${mealPlanData.title}",
  "items": [
    { "name": "Nombre del alimento", "quantity": "cantidad total", "unit": "unidad" }
  ]
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-5.6-luna",
        messages: [
            { role: "system", content: SHOPPING_LIST_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 16000,
        response_format: { type: "json_object" },
    });

    const content = extractJsonFromResponse(completion.choices[0]?.message as any);
    if (!content) throw new Error("La IA no devolvió una respuesta válida");

    const parsed = JSON.parse(content) as GeneratedShoppingList;
    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error("La respuesta de la IA no tiene la estructura esperada");
    }
    return parsed;
}
