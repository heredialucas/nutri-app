import OpenAI from "openai";
import { extractJsonFromResponse } from "./extract-json";
import { patientService } from "@/services/patient-service";
import { medicalHistoryService } from "@/services/medical-history-service";
import { measurementService } from "@/services/measurement-service";
import { followupService } from "@/services/followup-service";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface PlanOptions {
    calorieTarget: number;
    mealsPerDay: number;
    dietaryType: string[];
    restrictions: string[];
    includeFoods: string;
    excludeFoods: string;
    additionalNotes: string;
    proteinTarget?: number; // g/día
    carbTarget?: number; // g/día
    fatTarget?: number; // g/día
    macroPreset?: string; // nombre del preset elegido (opcional, para el prompt)
}

export interface GeneratedFood {
    name: string;
    quantity: string;
    unit: string;
    notes: string;
    calories?: number; // kcal aproximadas
    protein?: number; // g
    carbs?: number; // g
    fat?: number; // g
}

export interface GeneratedMeal {
    label: string;
    mealOrder: number;
    foods: GeneratedFood[];
    calories?: number; // kcal totales de la comida
    protein?: number; // g totales
    carbs?: number; // g totales
    fat?: number; // g totales
    notes?: string; // comentario/indicación de la comida
}

export interface GeneratedDay {
    dayOrder: number;
    label: string;
    meals: GeneratedMeal[];
}

export interface GeneratedSupplement {
    name: string;
    dosage?: string; // dosis, ej. "30g", "1 scoop"
    timing?: string; // momento, ej. "Post-entreno", "Por la mañana"
    frequency?: string; // frecuencia, ej. "Diario", "3x/semana"
    notes?: string; // instrucción/aclaración
}

export interface GeneratedMealPlan {
    title: string;
    description: string;
    calorieTarget: number;
    notes: string;
    tips?: string;
    dailyCalories?: number;
    dailyProtein?: number; // g
    dailyCarbs?: number; // g
    dailyFat?: number; // g
    supplements?: GeneratedSupplement[];
    days: GeneratedDay[];
}

function calculateAge(birthDate: Date | string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function buildPatientContext(patient: any): string {
    const sections: string[] = [];

    // Demographics
    const age = patient.birthDate ? calculateAge(patient.birthDate) : "no especificada";
    sections.push(`[DATOS DEMOGRÁFICOS]
- Nombre: ${patient.firstName} ${patient.lastName}
- Edad: ${age} años
- Ocupación: ${patient.occupation || "no especificada"}`);

    // Medical History
    if (patient.medicalHistory) {
        const mh = patient.medicalHistory;
        const historyFields: string[] = [];
        if (mh.familyHistory) historyFields.push(`Antecedentes familiares: ${mh.familyHistory}`);
        if (mh.personalHistory) historyFields.push(`Historia personal: ${mh.personalHistory}`);
        if (mh.surgeries) historyFields.push(`Cirugías: ${mh.surgeries}`);
        if (mh.diagnoses) historyFields.push(`Diagnósticos: ${mh.diagnoses}`);
        if (mh.habits) historyFields.push(`Hábitos: ${mh.habits}`);
        if (mh.sleepHours) historyFields.push(`Horas de sueño: ${mh.sleepHours}`);
        if (mh.physicalActivity) historyFields.push(`Actividad física: ${mh.physicalActivity}`);
        if (mh.digestiveSymptoms) historyFields.push(`Síntomas digestivos: ${mh.digestiveSymptoms}`);
        if (mh.observations) historyFields.push(`Observaciones: ${mh.observations}`);

        if (historyFields.length > 0) {
            sections.push(`[HISTORIA CLÍNICA]\n${historyFields.join("\n")}`);
        }
    }

    // Allergies
    if (patient.allergies && patient.allergies.length > 0) {
        const allergyList = patient.allergies
            .map((a: any) => `- ${a.name}${a.reaction ? ` (reacción: ${a.reaction})` : ""}${a.severity ? ` [${a.severity}]` : ""}`)
            .join("\n");
        sections.push(`[ALERGIAS E INTOLERANCIAS]\n${allergyList}`);
    } else {
        sections.push("[ALERGIAS E INTOLERANCIAS]\nNo registra alergias conocidas");
    }

    // Medications
    if (patient.medications && patient.medications.length > 0) {
        const medList = patient.medications
            .map((m: any) => `- ${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` (${m.frequency})` : ""}${m.indication ? ` - ${m.indication}` : ""}`)
            .join("\n");
        sections.push(`[MEDICACIÓN ACTIVA]\n${medList}`);
    } else {
        sections.push("[MEDICACIÓN ACTIVA]\nNo toma medicación");
    }

    // Goals
    if (patient.goals && patient.goals.length > 0) {
        const goalList = patient.goals
            .map((g: any) => `- ${g.type}${g.description ? `: ${g.description}` : ""}${g.targetValue ? ` (meta: ${g.targetValue})` : ""}`)
            .join("\n");
        sections.push(`[OBJETIVOS]\n${goalList}`);
    } else {
        sections.push("[OBJETIVOS]\nNo se definieron objetivos específicos");
    }

    return sections.join("\n\n");
}

function buildMeasurementContext(measurements: any[]): string {
    if (!measurements || measurements.length === 0) {
        return "[MEDICIONES]\nNo hay mediciones antropométricas registradas";
    }

    const latest = measurements[0];
    const fields: string[] = [];
    if (latest.weight) fields.push(`Peso: ${latest.weight} kg`);
    if (latest.height) fields.push(`Altura: ${latest.height} cm`);
    if (latest.bmi) fields.push(`IMC: ${latest.bmi}`);
    if (latest.waist) fields.push(`Cintura: ${latest.waist} cm`);
    if (latest.hip) fields.push(`Cadera: ${latest.hip} cm`);
    if (latest.arm) fields.push(`Brazo: ${latest.arm} cm`);
    if (latest.bodyFatPercentage) fields.push(`% Grasa corporal: ${latest.bodyFatPercentage}%`);
    if (latest.muscleMass) fields.push(`Masa muscular: ${latest.muscleMass} kg`);

    return `[MEDICIONES ANTROPOMÉTRICAS]\n${fields.join("\n")}`;
}

function buildFollowUpContext(followUps: any[]): string {
    if (!followUps || followUps.length === 0) {
        return "[SEGUIMIENTOS]\nNo hay seguimientos previos registrados";
    }

    const recent = followUps.slice(0, 3);
    const entries = recent.map((fu: any) => {
        const parts: string[] = [`Semana del ${new Date(fu.weekStart).toLocaleDateString("es-AR")}`];
        if (fu.weight) parts.push(`Peso: ${fu.weight} kg`);
        if (fu.adherence) parts.push(`Adherencia: ${fu.adherence}`);
        if (fu.hunger) parts.push(`Hambre: ${fu.hunger}`);
        if (fu.energy) parts.push(`Energía: ${fu.energy}`);
        if (fu.difficulties) parts.push(`Dificultades: ${fu.difficulties}`);
        if (fu.patientNotes) parts.push(`Notas paciente: ${fu.patientNotes}`);
        return parts.join(", ");
    });

    return `[SEGUIMIENTOS RECIENTES]\n${entries.join("\n")}`;
}

const SYSTEM_PROMPT = `Sos un profesional de nutrición matriculado, especialista en nutrición clínica y deportiva. Tu rol es generar planes alimentarios personalizados, basados en evidencia científica y adaptados a las necesidades individuales de cada paciente.

Reglas estrictas:
- Respetá TODAS las alergias e intolerancias alimentarias del paciente. Nunca incluyas alimentos que provoquen reacciones alérgicas.
- Considerá interacciones medicamento-nutriente cuando el paciente tome medicación.
- Alineá las calorías y macronutrientes con los objetivos del paciente.
- Calculá y reportá los macronutrientes: para cada alimento indicá sus calorías aproximadas (kcal) y gramos de proteína, carbohidratos y grasas. Sumá estos valores por comida y luego el total diario.
- Incluí alimentos variados, accesibles y económicos en Argentina.
- Usá unidades métricas (gramos, ml).
- Las porciones deben ser realistas y específicas.
- Generá exactamente 7 días (de Lunes a Domingo).
- Cada día debe tener 5 comidas: Desayuno, Media mañana, Almuerzo, Merienda, Cena.
- Cada comida debe tener entre 3 y 6 alimentos.
- Incluí variaciones entre los días para no ser monótono.
- Considerá la actividad física del paciente para ajustar porciones.
- Si hay síntomas digestivos, evitá alimentos que los empeoren (picantes, grasas pesadas, etc.).
- Respondé SOLO con JSON válido, sin texto adicional.`;

function buildUserPrompt(
    patientContext: string,
    measurementContext: string,
    followUpContext: string,
    options: PlanOptions,
    customPrompt?: string
): string {
    const mealLabels: Record<number, string[]> = {
        3: ["Almuerzo", "Merienda", "Cena"],
        4: ["Desayuno", "Almuerzo", "Merienda", "Cena"],
        5: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena"],
        6: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena", "Colación"],
    };
    const meals = mealLabels[options.mealsPerDay] || mealLabels[5];

    const restrictionsText = options.dietaryType.length > 0
        ? `Tipo de dieta: ${options.dietaryType.join(", ")}`
        : "Sin restricción dietaria específica";

    const allergiesText = options.restrictions.length > 0
        ? `Restricciones/preferencias: ${options.restrictions.join(", ")}`
        : "";

    const includeText = options.includeFoods.trim()
        ? `Alimentos que DEBE incluir: ${options.includeFoods.trim()}`
        : "";

    const excludeText = options.excludeFoods.trim()
        ? `Alimentos que DEBE EXCLUIR: ${options.excludeFoods.trim()}`
        : "";

    const macroTargets: string[] = [];
    if (options.proteinTarget) macroTargets.push(`${options.proteinTarget} g de proteína`);
    if (options.carbTarget) macroTargets.push(`${options.carbTarget} g de carbohidratos`);
    if (options.fatTarget) macroTargets.push(`${options.fatTarget} g de grasas`);
    const macroPresetText = options.macroPreset
        ? `\n- Distribución de macronutrientes elegida: ${options.macroPreset}${macroTargets.length ? ` (objetivos: ${macroTargets.join(", ")})` : ""}`
        : macroTargets.length
        ? `\n- Objetivos de macronutrientes por día: ${macroTargets.join(", ")}`
        : "";

    const customSection = customPrompt?.trim()
        ? `\nINSTRUCCIONES ADICIONALES DEL PROFESIONAL:\n${customPrompt.trim()}`
        : "";

    return `Generá un plan alimentario semanal completo para el siguiente paciente:

${patientContext}

${measurementContext}

${followUpContext}

CONFIGURACIÓN DEL PLAN:
- Duración: 7 días (Lunes a Domingo)
- Comidas por día: ${options.mealsPerDay} (${meals.join(", ")})
- Calorías objetivo: ${options.calorieTarget} kcal/día${macroPresetText}
${restrictionsText ? `- ${restrictionsText}` : ""}
${allergiesText ? `- ${allergiesText}` : ""}
${includeText ? `- ${includeText}` : ""}
${excludeText ? `- ${excludeText}` : ""}
${customSection}

La suma de las calorías y macronutrientes de los 7 días debe ser CONSISTENTE con las calorías objetivo y los objetivos de macronutrientes indicados. Calculá en cada alimento sus calorías (kcal) y gramos de proteína, carbohidratos y grasas; sumá por comida y por día.

Añadí un listado de SUPLEMENTOS recomendados (suplementos y ayudas ergogénicas adecuadas al paciente y sus objetivos) en el campo "supplements". Si no corresponde recomendar suplementos para este paciente, devolvé un arreglo vacío [].

FORMATO DE RESPUESTA - JSON con la siguiente estructura exacta:

{
  "title": "Título descriptivo del plan",
  "description": "Breve descripción del enfoque nutricional del plan",
  "calorieTarget": ${options.calorieTarget},
  "dailyCalories": <número entero, kcal diarias totales>,
  "dailyProtein": <número entero, gramos de proteína diarios>,
  "dailyCarbs": <número entero, gramos de carbohidratos diarios>,
  "dailyFat": <número entero, gramos de grasas diarias>,
  "notes": "Notas privadas para el profesional sobre decisiones tomadas en el plan",
  "supplements": [
    {
      "name": "Nombre del suplemento (ej. Proteína en polvo, Creatina, Omega-3)",
      "dosage": "Dosis (ej. 30g, 1 scoop, 2 cápsulas)",
      "timing": "Momento del día (ej. Post-entreno, Con el desayuno)",
      "frequency": "Frecuencia (ej. Diario, Solo días de entreno)",
      "notes": "Instrucción o aclaración para el paciente (puede ser vacío)"
    }
  ],
  "days": [
    {
      "dayOrder": 1,
      "label": "Día 1 - Lunes",
      "meals": [
        {
          "label": "Nombre de la comida",
          "mealOrder": 1,
          "calories": <kcal totales de la comida>,
          "protein": <gramos de proteína de la comida>,
          "carbs": <gramos de carbohidratos de la comida>,
          "fat": <gramos de grasas de la comida>,
          "notes": "Comentario o indicación para el paciente sobre esta comida (opcional, puede ser vacío)",
          "foods": [
            {
              "name": "Nombre del alimento",
              "quantity": "cantidad numérica",
              "unit": "unidades (g, ml, unidades, taza, cucharada, etc.)",
              "calories": <kcal aproximadas del alimento>,
              "protein": <gramos aproximados>,
              "carbs": <gramos aproximados>,
              "fat": <gramos aproximados>,
              "notes": "preparación o aclaración"
            }
          ]
        }
      ]
    }
  ]
}`;
}

export async function generateMealPlan(
    patientId?: string | null,
    options?: PlanOptions,
    customPrompt?: string
): Promise<GeneratedMealPlan> {
    if (!options) {
        throw new Error("Faltan las opciones del plan");
    }

    let patientContext = "[DATOS DEMOGRÁFICOS]\n- Paciente no especificado (plan genérico)";
    let measurementContext = "[MEDICIONES ANTROPOMÉTRICAS]\nNo hay mediciones registradas";
    let followUpContext = "[SEGUIMIENTOS]\nNo hay seguimientos previos registrados";

    if (patientId) {
        const patient = await patientService.getById(patientId);
        if (!patient) throw new Error("Paciente no encontrado");

        const [measurements, followUps] = await Promise.all([
            measurementService.getByPatient(patientId),
            followupService.getByPatient(patientId),
        ]);

        patientContext = buildPatientContext(patient);
        measurementContext = buildMeasurementContext(measurements);
        followUpContext = buildFollowUpContext(followUps);
    }

    const userPrompt = buildUserPrompt(patientContext, measurementContext, followUpContext, options, customPrompt);

    const completion = await openai.chat.completions.create({
        model: "gpt-5.6-luna",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 60000,
        response_format: { type: "json_object" },
    });

    let content = completion.choices[0]?.message?.content ?? "";
    if (!content) {
        content = extractJsonFromResponse(completion.choices[0]?.message as any);
    }
    if (!content) throw new Error("La IA no devolvió una respuesta válida");

    try {
        const parsed = JSON.parse(content) as GeneratedMealPlan;

        // Validate required structure
        if (!parsed.title || !parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
            throw new Error("La respuesta de la IA no tiene la estructura esperada");
        }

        // Ensure 7 days
        if (parsed.days.length !== 7) {
            // Pad or trim to exactly 7
            const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
            while (parsed.days.length < 7) {
                const nextDay = parsed.days.length + 1;
                parsed.days.push({
                    dayOrder: nextDay,
                    label: `Día ${nextDay} - ${dayLabels[nextDay - 1] || `Día ${nextDay}`}`,
                    meals: [
                        { label: "Desayuno", mealOrder: 1, foods: [] },
                        { label: "Media mañana", mealOrder: 2, foods: [] },
                        { label: "Almuerzo", mealOrder: 3, foods: [] },
                        { label: "Merienda", mealOrder: 4, foods: [] },
                        { label: "Cena", mealOrder: 5, foods: [] },
                    ],
                });
            }
            parsed.days = parsed.days.slice(0, 7);
        }

        // Normalize: compute per-meal totals from foods if not provided by the AI
        for (const day of parsed.days) {
            for (const meal of day.meals) {
                meal.foods = (meal.foods || []).map((f) => {
                    const num = (v: unknown) => (typeof v === "number" && !Number.isNaN(v) ? v : undefined);
                    return {
                        name: String(f.name ?? ""),
                        quantity: String(f.quantity ?? ""),
                        unit: String(f.unit ?? ""),
                        notes: String(f.notes ?? ""),
                        calories: num(f.calories),
                        protein: num(f.protein),
                        carbs: num(f.carbs),
                        fat: num(f.fat),
                    };
                });
                if (
                    meal.calories === undefined &&
                    meal.foods.some((f) => f.calories !== undefined)
                ) {
                    meal.calories = Math.round(
                        meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0)
                    );
                }
                if (
                    meal.protein === undefined &&
                    meal.foods.some((f) => f.protein !== undefined)
                ) {
                    meal.protein = Math.round(
                        meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0) * 10
                    ) / 10;
                }
                if (
                    meal.carbs === undefined &&
                    meal.foods.some((f) => f.carbs !== undefined)
                ) {
                    meal.carbs = Math.round(
                        meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0) * 10
                    ) / 10;
                }
                if (
                    meal.fat === undefined &&
                    meal.foods.some((f) => f.fat !== undefined)
                ) {
                    meal.fat = Math.round(
                        meal.foods.reduce((sum, f) => sum + (f.fat || 0), 0) * 10
                    ) / 10;
                }
            }
        }

        // Compute daily totals if not provided
        if (parsed.dailyCalories === undefined) {
            parsed.dailyCalories = Math.round(
                parsed.days.reduce(
                    (sum, d) => sum + d.meals.reduce((s, m) => s + (m.calories || 0), 0),
                    0
                ) / Math.max(1, parsed.days.length)
            );
        }
        if (parsed.dailyProtein === undefined) {
            parsed.dailyProtein = Math.round(
                parsed.days.reduce(
                    (sum, d) => sum + d.meals.reduce((s, m) => s + (m.protein || 0), 0),
                    0
                ) * 10 / Math.max(1, parsed.days.length)
            ) / 10;
        }
        if (parsed.dailyCarbs === undefined) {
            parsed.dailyCarbs = Math.round(
                parsed.days.reduce(
                    (sum, d) => sum + d.meals.reduce((s, m) => s + (m.carbs || 0), 0),
                    0
                ) * 10 / Math.max(1, parsed.days.length)
            ) / 10;
        }
        if (parsed.dailyFat === undefined) {
            parsed.dailyFat = Math.round(
                parsed.days.reduce(
                    (sum, d) => sum + d.meals.reduce((s, m) => s + (m.fat || 0), 0),
                    0
                ) * 10 / Math.max(1, parsed.days.length)
            ) / 10;
        }

        return parsed;
    } catch {
        throw new Error("Error al procesar la respuesta de la IA. Intentá nuevamente.");
    }
}
