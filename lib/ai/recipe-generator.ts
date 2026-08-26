import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedRecipe {
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
}

export interface GeneratedRecipeBatch {
    recipes: GeneratedRecipe[];
}

const RECIPE_SYSTEM_PROMPT = `Sos un profesional de nutrición y chef especializado en cocina saludable. Tu rol es generar recetas nutritivas, sabrosas y accesibles.

Reglas:
- Usá ingredientes accesibles en supermercados argentinos
- Incluí cantidades precisas en gramos o ml
- Separá ingredientes uno por línea
- Las instrucciones deben ser claras y numeradas
- Considerá restricciones alimentarias del paciente
- Respondé SOLO con JSON válido`;

export async function generateRecipe(prompt: string, patientContext?: string): Promise<GeneratedRecipe> {
    const userPrompt = `Generá una receta saludable con la siguiente descripción: "${prompt}"
${patientContext ? `\nContexto del paciente:\n${patientContext}` : ""}

Respondé con JSON con esta estructura exacta:
{
  "title": "Nombre de la receta",
  "description": "Breve descripción de la receta",
  "ingredients": "Ingrediente 1 cantidad\nIngrediente 2 cantidad\nIngrediente 3 cantidad",
  "instructions": "Paso 1: ...\nPaso 2: ...\nPaso 3: ..."
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: RECIPE_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("La IA no devolvió una respuesta válida");

    const parsed = JSON.parse(content) as GeneratedRecipe;
    if (!parsed.title || !parsed.ingredients) {
        throw new Error("La respuesta de la IA no tiene la estructura esperada");
    }
    return parsed;
}

export async function generateRecipesFromMealPlan(
    mealPlanData: { title: string; days: { meals: { label: string; foods: { name: string; quantity: string; unit: string }[] }[] }[] },
    patientContext?: string
): Promise<GeneratedRecipeBatch> {
    const mealsSummary = mealPlanData.days
        .flatMap((day) =>
            day.meals.map((meal) =>
                `${meal.label}: ${meal.foods.map((f) => `${f.name} (${f.quantity} ${f.unit})`).join(", ")}`
            )
        )
        .join("\n");

    const userPrompt = `A partir del siguiente plan alimentario, generá recetas detalladas para las comidas principales (almuerzo y cena). Para cada comida, creá una receta con ingredientes e instrucciones completas.

PLAN ALIMENTARIO:
${mealsSummary}

${patientContext ? `\nContexto del paciente:\n${patientContext}` : ""}

Generá entre 5 y 7 recetas (una por cada comida principal variada del plan).

Respondé con JSON con esta estructura exacta:
{
  "recipes": [
    {
      "title": "Nombre de la receta",
      "description": "Breve descripción",
      "ingredients": "Ingrediente 1 cantidad\\nIngrediente 2 cantidad",
      "instructions": "Paso 1: ...\\nPaso 2: ..."
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: RECIPE_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("La IA no devolvió una respuesta válida");

    const parsed = JSON.parse(content) as GeneratedRecipeBatch;
    if (!parsed.recipes || !Array.isArray(parsed.recipes) || parsed.recipes.length === 0) {
        throw new Error("La respuesta de la IA no tiene la estructura esperada");
    }
    return parsed;
}
