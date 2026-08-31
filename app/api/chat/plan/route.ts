import OpenAI from "openai";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
    buildPlanChatSystemPrompt,
    buildPlanChatTools,
    normalizePlanPatch,
    type PlanChatMessage,
    type PlanChatContext,
    type PlanPatch,
} from "@/lib/ai/plan-chat";
import {
    buildPatientContext,
    buildMeasurementContext,
    buildFollowUpContext,
    type GeneratedMealPlan,
} from "@/lib/ai/meal-plan-generator";
import { patientService } from "@/services/patient-service";
import { measurementService } from "@/services/measurement-service";
import { followupService } from "@/services/followup-service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o-mini";

interface ChatPlanRequest {
    messages: PlanChatMessage[];
    plan: GeneratedMealPlan;
    patientId?: string;
    patientContext?: string;
    originalOptions?: string;
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.user) {
        return new Response(JSON.stringify({ error: "No autenticado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let body: ChatPlanRequest;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "JSON inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { messages, plan, patientId, patientContext, originalOptions } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: "Mensajes requeridos" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
    if (!plan || !plan.days || !Array.isArray(plan.days)) {
        return new Response(JSON.stringify({ error: "Plan requerido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    let resolvedPatientContext = patientContext;
    if (patientId) {
        const patient = await patientService.getById(patientId);
        if (!patient) {
            return new Response(JSON.stringify({ error: "Paciente no encontrado" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const [measurements, followUps] = await Promise.all([
            measurementService.getByPatient(patientId),
            followupService.getByPatient(patientId),
        ]);
        resolvedPatientContext = [
            buildPatientContext(patient),
            buildMeasurementContext(measurements),
            buildFollowUpContext(followUps),
        ].join("\n\n");
    }

    const ctx: PlanChatContext = { plan, patientContext: resolvedPatientContext, originalOptions };
    const systemPrompt = buildPlanChatSystemPrompt(ctx);
    const tools = buildPlanChatTools();

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.slice(0, 12).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        })),
    ];

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            let textContent = "";
            let patch: PlanPatch | null = null;
            let toolName = "";
            let bufferArgs = "";
            let currentToolIndex = -1;
            let usedTool = false;
            let patchError: string | null = null;

            try {
                const stream = await openai.chat.completions.create({
                    model: MODEL,
                    messages: openaiMessages,
                    tools,
                    tool_choice: { type: "function", function: { name: "apply_plan_update" } },
                    max_completion_tokens: 16384,
                    stream: true,
                });

                for await (const chunk of stream) {
                    const delta = chunk.choices?.[0]?.delta;
                    if (!delta) continue;

                    // Acumulamos el texto pero NO lo enviamos aún: si el modelo
                    // decide usar la tool, descartamos cualquier texto de proceso.
                    if (delta.content) {
                        textContent += delta.content;
                    }

                    if (delta.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            if (tc.index !== undefined && tc.index !== currentToolIndex) {
                                flushTool(currentToolIndex);
                                currentToolIndex = tc.index;
                                bufferArgs = "";
                                toolName = tc.function?.name || "";
                            }
                            if (tc.function?.arguments) {
                                usedTool = true;
                                bufferArgs += tc.function.arguments;
                                send(controller, encoder, {
                                    type: "tool_call",
                                    name: toolName || "apply_plan_update",
                                    call_id: tc.id || "",
                                });
                            }
                        }
                    }

                    if (chunk.choices?.[0]?.finish_reason === "tool_calls") usedTool = true;
                }

                flushTool(currentToolIndex);

                // Si la primera salida quedó incompleta, le pedimos a la IA que
                // reconstruya el plan completo. Nunca se aplica un fragmento.
                if (usedTool && (!patch || patchError)) {
                    const repaired = await repairPlanUpdate(systemPrompt, messages, plan);
                    if (repaired) {
                        patch = repaired;
                        patchError = null;
                    }
                }

                if (usedTool && patchError) {
                    send(controller, encoder, { type: "error", message: patchError });
                } else if (usedTool && patch) {
                    send(controller, encoder, {
                        type: "plan_update",
                        patch,
                        tool_name: toolName,
                    });

                    const summary = await generateSummary(messages, textContent);
                    if (summary) {
                        send(controller, encoder, { type: "text", text: summary });
                    }
                } else if (textContent.trim()) {
                    // Sin tool: el texto es la respuesta del asistente. Lo mostramos.
                    send(controller, encoder, { type: "text", text: textContent });
                } else {
                    send(controller, encoder, {
                        type: "text",
                        text: "No pude generar una actualización válida del plan. No se aplicó ningún cambio.",
                    });
                }

                send(controller, encoder, { type: "done" });
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Error desconocido";
                send(controller, encoder, { type: "error", message: msg });
            } finally {
                controller.close();
            }

            function flushTool(idx: number) {
                if (idx >= 0 && bufferArgs.trim()) {
                    try {
                        const parsed = JSON.parse(bufferArgs);
                        const p: PlanPatch = {};
                        if (parsed.title !== undefined) p.title = parsed.title;
                        if (parsed.description !== undefined) p.description = parsed.description;
                        if (parsed.calorieTarget !== undefined) p.calorieTarget = parsed.calorieTarget;
                        if (parsed.tips !== undefined) p.tips = parsed.tips;
                        if (parsed.dailyCalories !== undefined) p.dailyCalories = parsed.dailyCalories;
                        if (parsed.dailyProtein !== undefined) p.dailyProtein = parsed.dailyProtein;
                        if (parsed.dailyCarbs !== undefined) p.dailyCarbs = parsed.dailyCarbs;
                        if (parsed.dailyFat !== undefined) p.dailyFat = parsed.dailyFat;
                        if (parsed.days !== undefined) p.days = parsed.days;
                        if (parsed.supplements !== undefined) p.supplements = parsed.supplements;
                        if (Object.keys(p).length > 0) {
                            if (!p.days || !isCompletePlanDays(p.days, plan)) {
                                patchError = "La IA no devolvió el plan completo. No se aplicó ningún cambio.";
                                return;
                            }
                            patch = normalizePlanPatch(p, plan);
                        } else {
                            patchError = "La IA no devolvió cambios aplicables. No se modificó el plan.";
                        }
                    } catch {
                        patchError = "No se pudo interpretar la actualización. No se aplicó ningún cambio.";
                    }
                }
            }
        },
    });

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

function isCompletePlanDays(days: GeneratedMealPlan["days"], currentPlan: GeneratedMealPlan): boolean {
    if (days.length !== currentPlan.days.length) return false;
    const currentOrders = new Set(currentPlan.days.map((day) => day.dayOrder));
    return days.every((day) => currentOrders.has(day.dayOrder) && Array.isArray(day.meals));
}

async function repairPlanUpdate(
    systemPrompt: string,
    messages: PlanChatMessage[],
    currentPlan: GeneratedMealPlan
): Promise<PlanPatch | null> {
    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: `${systemPrompt}\n\nREPARACIÓN OBLIGATORIA: devolvé únicamente un JSON válido con el plan completo actualizado. No devuelvas un fragmento, no uses una tool y no incluyas el campo de notas privadas. Conservá exactamente todos los días, comidas y alimentos no solicitados.`,
                },
                ...messages.slice(-6).map((message) => ({
                    role: message.role as "user" | "assistant",
                    content: message.content,
                })),
                {
                    role: "user",
                    content: `Reconstruí el plan completo a partir de este plan actual y aplicá solamente el último pedido. Plan actual: ${JSON.stringify({ ...currentPlan, notes: "" })}`,
                },
            ],
            max_completion_tokens: 16384,
            response_format: { type: "json_object" },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) return null;
        const parsed = JSON.parse(content) as PlanPatch;
        if (!parsed.days || !isCompletePlanDays(parsed.days, currentPlan)) return null;
        return normalizePlanPatch(parsed, currentPlan);
    } catch {
        return null;
    }
}

async function generateSummary(
    messages: PlanChatMessage[],
    introText: string
): Promise<string | null> {
    try {
        const last = [...messages].reverse().find((m) => m.role === "user");
        const summary = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content:
                        "Sos un asistente de nutrición. Escribí en UNA o DOS oraciones breves y en español un resumen de los cambios que acabás de aplicar al plan alimentario, confirmando al profesional qué se modificó. No repitas todo, solo lo esencial. No uses markdown ni viñetas.",
                },
                {
                    role: "user",
                    content: `Pedido del usuario: ${last?.content || ""}\n\nResumí de forma breve y afirmativa los cambios aplicados al plan.`,
                },
            ],
            max_tokens: 180,
        });
        const text = summary.choices?.[0]?.message?.content?.trim();
        return text ? `\n\n${text}` : null;
    } catch {
        return null;
    }
}

function send(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    data: Record<string, unknown>
) {
    try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
        // stream cerrado
    }
}
