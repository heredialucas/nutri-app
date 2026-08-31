"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
    Bot,
    User,
    Send,
    Loader2,
    Sparkles,
    CheckCircle2,
    X,
    MessageCircle,
    Wand2,
    RefreshCw,
} from "lucide-react";
import type { GeneratedMealPlan } from "@/lib/ai/meal-plan-generator";
import { applyPlanPatch, type PlanPatch } from "@/lib/ai/plan-chat";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface PlanChatDrawerProps {
    plan: GeneratedMealPlan | null;
    onPlanChange: (plan: GeneratedMealPlan, previousPlan: GeneratedMealPlan, changedFoodKeys: string[]) => void;
    originalOptions?: string;
    patientId?: string;
}

function MarkdownText({ text }: { text: string }) {
    const html = text
        .replace(/&/g, "&amp;")
        .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/<(?!\/?(?:strong|em|code|pre|a|h[1-6]|li|br)\b)[^>]+>/g, "")
        .replace(/\n{2,}/g, "</p><p>")
        .replace(/\n/g, "<br>");

    return (
        <div
            className="[&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 dark:[&_code]:bg-white/10 [&_code]:px-1 [&_code]:text-xs [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_p]:last:mb-0"
            dangerouslySetInnerHTML={{
                __html: html.startsWith("</p><p>") ? html.slice(7) : html,
            }}
        />
    );
}

export function PlanChatDrawer({
    plan,
    onPlanChange,
    originalOptions,
    patientId,
}: PlanChatDrawerProps) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [status, setStatus] = useState<"idle" | "waiting" | "tool" | "applied">("idle");
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const planRef = useRef<GeneratedMealPlan | null>(plan);
    planRef.current = plan;

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                {
                    role: "assistant",
                    content:
                        "Hola! Soy tu asistente nutricional. Puedo ayudarte a modificar este plan: cambiar alimentos, ajustar porciones, modificar macros, agregar o quitar comidas, actualizar notas y más. ¿Qué querés cambiar?",
                },
            ]);
        }
    }, [open, messages.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, status]);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const buildRequestBody = (chatMessages: ChatMessage[]) => {
        return JSON.stringify({
            messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
            plan: planRef.current,
            patientId,
            patientContext: undefined,
            originalOptions: originalOptions,
        });
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isStreaming || !planRef.current) return;

        const userMsg: ChatMessage = { role: "user", content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsStreaming(true);
        setStatus("waiting");
        setLastUpdate(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch("/api/chat/plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: buildRequestBody(updatedMessages),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Error al conectar con el asistente");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantText = "";
            let buffer = "";

            const applyStreamUpdate = () => {
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    const next = [...prev];
                    if (last?.role === "assistant") {
                        next[next.length - 1] = { role: "assistant", content: assistantText };
                    } else {
                        next.push({ role: "assistant", content: assistantText });
                    }
                    return next;
                });
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const frames = buffer.split("\n\n");
                buffer = frames.pop() || "";

                for (const frame of frames) {
                    const line = frame.trim();
                    if (!line.startsWith("data:")) continue;
                    let data: any;
                    try {
                        data = JSON.parse(line.replace(/^data:\s*/, ""));
                    } catch {
                        continue;
                    }

                    if (data.type === "text") {
                        if (status === "waiting") setStatus("idle");
                        assistantText += data.text;
                        applyStreamUpdate();
                    } else if (data.type === "tool_call") {
                        setStatus("tool");
                    } else if (data.type === "plan_update" && data.patch) {
                        const patch = data.patch as PlanPatch;
                        if (planRef.current) {
                            const previous = planRef.current;
                            const updated = applyPlanPatch(previous, patch);
                            planRef.current = updated;
                            onPlanChange(updated, previous, getChangedFoodKeys(previous, updated));
                        }
                        setStatus("applied");
                        setLastUpdate("Plan actualizado");
                    } else if (data.type === "done") {
                        applyStreamUpdate();
                        setStatus("idle");
                    } else if (data.type === "error") {
                        assistantText =
                            assistantText +
                            (assistantText ? "\n\n" : "") +
                            `⚠️ ${data.message || "Ocurrió un error"}`;
                        applyStreamUpdate();
                        setStatus("idle");
                    }
                }
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `⚠️ Ocurrió un error. Intentá nuevamente.` },
            ]);
            setStatus("idle");
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
        setIsStreaming(false);
        setStatus("idle");
    };

    const currentPlan = plan as GeneratedMealPlan | null;

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-5 right-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all hover:bg-purple-700 hover:scale-105 max-sm:bottom-4 max-sm:right-4 max-sm:size-11"
                    aria-label="Abrir chat del plan"
                >
                    {isStreaming ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <MessageCircle className="size-5 max-sm:size-4.5" />
                    )}
                </button>
            )}

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end max-sm:items-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

                    <div className="relative flex w-full flex-col bg-background shadow-xl animate-in slide-in-from-right max-sm:slide-in-from-bottom sm:max-w-md max-sm:max-h-[85vh] max-sm:h-[85vh] max-sm:rounded-t-xl">
                        <div className="flex items-center justify-between border-b px-4 py-3 max-sm:px-3 max-sm:py-2.5">
                            <div className="flex flex-col gap-0.5">
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <Sparkles className="size-4 text-purple-500" />
                                    Asistente de plan
                                </h2>
                                {status === "applied" && lastUpdate && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="size-3" />
                                        {lastUpdate} — ya se refleja en el plan
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                aria-label="Cerrar chat"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 max-sm:px-3 max-sm:space-y-2">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                                        m.role === "user"
                                            ? "bg-purple-600 text-white ml-4 sm:ml-8"
                                            : "bg-muted text-foreground mr-4 sm:mr-8"
                                    }`}
                                >
                                    {m.role === "assistant" ? (
                                        <MarkdownText text={m.content} />
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            ))}

                            {isStreaming && (
                                <div className="flex items-start gap-2 px-1 pt-1">
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
                                        <Bot className="size-3.5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                        {status === "tool" ? (
                                            <span className="flex items-center gap-1.5">
                                                <Wand2 className="size-3 animate-pulse" />
                                                Aplicando cambios al plan...
                                            </span>
                                        ) : status === "applied" ? (
                                            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                <CheckCircle2 className="size-3" />
                                                Cambios aplicados
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5">
                                                <RefreshCw className="size-3 animate-spin" />
                                                Pensando y analizando tu pedido...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        <div className="flex items-end gap-2 border-t px-3 py-2.5 max-sm:px-2.5">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ej: cambiale el pollo del almuerzo del lunes por pescado..."
                                rows={1}
                                className="max-h-32 min-h-[42px] resize-none text-sm"
                                disabled={isStreaming || !currentPlan}
                            />
                            {isStreaming ? (
                                <button
                                    type="button"
                                    onClick={handleStop}
                                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border"
                                    aria-label="Detener"
                                >
                                    <Loader2 className="size-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={!input.trim() || !currentPlan}
                                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                                    aria-label="Enviar"
                                >
                                    <Send className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function getChangedFoodKeys(previous: GeneratedMealPlan, next: GeneratedMealPlan): string[] {
    const keys: string[] = [];
    const maxDays = Math.max(previous.days.length, next.days.length);
    for (let dayIndex = 0; dayIndex < maxDays; dayIndex++) {
        const previousMeals = previous.days[dayIndex]?.meals || [];
        const nextMeals = next.days[dayIndex]?.meals || [];
        const maxMeals = Math.max(previousMeals.length, nextMeals.length);
        for (let mealIndex = 0; mealIndex < maxMeals; mealIndex++) {
            const previousFoods = previousMeals[mealIndex]?.foods || [];
            const nextFoods = nextMeals[mealIndex]?.foods || [];
            const maxFoods = Math.max(previousFoods.length, nextFoods.length);
            for (let foodIndex = 0; foodIndex < maxFoods; foodIndex++) {
                if (JSON.stringify(previousFoods[foodIndex]) !== JSON.stringify(nextFoods[foodIndex])) {
                    keys.push(`${dayIndex}:${mealIndex}:${foodIndex}`);
                }
            }
        }
    }
    return keys;
}
