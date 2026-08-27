import OpenAI from "openai";
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
}

export interface GeneratedMealPlan {
    title: string;
    description: string;
    calorieTarget: number;
    notes: string;
    tips?: string;
    days: {
        dayOrder: number;
        label: string;
        meals: {
            label: string;
            mealOrder: number;
            foods: {
                name: string;
                quantity: string;
                unit: string;
                notes: string;
            }[];
        }[];
    }[];
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
- Calorías objetivo: ${options.calorieTarget} kcal/día
${restrictionsText ? `- ${restrictionsText}` : ""}
${allergiesText ? `- ${allergiesText}` : ""}
${includeText ? `- ${includeText}` : ""}
${excludeText ? `- ${excludeText}` : ""}
${customSection}

FORMATO DE RESPUESTA - JSON con la siguiente estructura exacta:

{
  "title": "Título descriptivo del plan",
  "description": "Breve descripción del enfoque nutricional del plan",
  "calorieTarget": ${options.calorieTarget},
  "notes": "Notas privadas para el profesional sobre decisiones tomadas en el plan",
  "days": [
    {
      "dayOrder": 1,
      "label": "Día 1 - Lunes",
      "meals": [
        {
          "label": "Nombre de la comida",
          "mealOrder": 1,
          "foods": [
            {
              "name": "Nombre del alimento",
              "quantity": "cantidad numérica",
              "unit": "unidades (g, ml, unidades, taza, cucharada, etc.)",
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
    patientId: string,
    options: PlanOptions,
    customPrompt?: string
): Promise<GeneratedMealPlan> {
    // Gather all patient data
    const patient = await patientService.getById(patientId);
    if (!patient) throw new Error("Paciente no encontrado");

    const [measurements, followUps] = await Promise.all([
        measurementService.getByPatient(patientId),
        followupService.getByPatient(patientId),
    ]);

    const patientContext = buildPatientContext(patient);
    const measurementContext = buildMeasurementContext(measurements);
    const followUpContext = buildFollowUpContext(followUps);
    const userPrompt = buildUserPrompt(patientContext, measurementContext, followUpContext, options, customPrompt);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
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

        return parsed;
    } catch {
        throw new Error("Error al procesar la respuesta de la IA. Intentá nuevamente.");
    }
}
