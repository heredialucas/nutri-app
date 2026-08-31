"use client";

import { useEffect, useRef, useState } from "react";
import {
    Bot,
    CheckCircle2,
    Loader2,
    MessageCircle,
    Send,
    Sparkles,
    X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Message {
    role: "user" | "assistant";
    content: string;
}

function MarkdownText({ text }: { text: string }) {
    const html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/\n/g, "<br />");

    return (
        <div
            className="[&_em]:italic [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

export function PatientChatDrawer() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([{
                role: "assistant",
                content: "Hola! Soy el asistente de tu portal. Podés preguntarme por tus turnos, tu plan, comidas, suplementos, recetas, listas de compras y seguimientos.",
            }]);
        }
    }, [open, messages.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const nextMessages = [...messages, { role: "user" as const, content: text }];
        setMessages(nextMessages);
        setInput("");
        setError(null);
        setLoading(true);

        const controller = new AbortController();
        abortRef.current = controller;
        let answer = "";

        const updateAnswer = () => {
            setMessages((current) => {
                const next = [...current];
                const last = next[next.length - 1];
                if (last?.role === "assistant") next[next.length - 1] = { role: "assistant", content: answer };
                else next.push({ role: "assistant", content: answer });
                return next;
            });
        };

        try {
            const response = await fetch("/api/chat/patient", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: nextMessages }),
                signal: controller.signal,
            });
            if (!response.ok || !response.body) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || "No se pudo conectar con el asistente");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const frames = buffer.split("\n\n");
                buffer = frames.pop() || "";
                for (const frame of frames) {
                    const line = frame.trim();
                    if (!line.startsWith("data:")) continue;
                    const data = JSON.parse(line.replace(/^data:\s*/, ""));
                    if (data.type === "text") {
                        answer += data.text;
                        updateAnswer();
                    } else if (data.type === "error") {
                        throw new Error(data.message || "No se pudo responder");
                    }
                }
            }
        } catch (caught) {
            if (caught instanceof DOMException && caught.name === "AbortError") return;
            setError(caught instanceof Error ? caught.message : "No se pudo responder la consulta");
            setMessages((current) => [...current, { role: "assistant", content: "No pude responder en este momento. Intentá nuevamente o contactá a Mauro Acosta." }]);
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-[#1a1a1a] text-white shadow-lg transition-transform hover:scale-105 max-sm:bottom-4 max-sm:right-4 max-sm:size-11"
                    aria-label="Abrir asistente del portal"
                >
                    <MessageCircle className="size-5" />
                </button>
            )}

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end max-sm:items-end">
                    <button className="absolute inset-0 cursor-default bg-black/30" onClick={() => setOpen(false)} aria-label="Cerrar asistente" />
                    <section className="relative flex h-full w-full flex-col bg-white shadow-xl animate-in slide-in-from-right sm:max-w-md max-sm:h-[85vh] max-sm:rounded-t-xl">
                        <header className="flex items-center justify-between border-b px-4 py-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]"><Sparkles className="size-4 text-[#22c55e]" />Asistente de mi portal</h2>
                                <p className="mt-0.5 text-xs text-[#777]">Consultá tu información disponible</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="flex size-7 items-center justify-center rounded-md text-[#777] hover:bg-[#f3f3f3]" aria-label="Cerrar chat"><X className="size-4" /></button>
                        </header>

                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {message.role === "assistant" && <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]"><Bot className="size-3.5 text-[#16a34a]" /></div>}
                                    <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "bg-[#1a1a1a] text-white" : "bg-[#f3f4f6] text-[#1a1a1a]"}`}>
                                        {message.role === "assistant" ? <MarkdownText text={message.content} /> : message.content}
                                    </div>
                                </div>
                            ))}
                            {loading && <div className="flex items-center gap-2 px-8 text-xs text-[#777]"><Loader2 className="size-3.5 animate-spin" />Consultando tu información...</div>}
                            {error && <div className="flex items-center gap-1.5 text-xs text-red-600"><CheckCircle2 className="size-3.5" />{error}</div>}
                            <div ref={bottomRef} />
                        </div>

                        <div className="flex items-end gap-2 border-t px-3 py-2.5">
                            <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ej: ¿cuándo es mi próximo turno?" rows={1} className="min-h-[42px] resize-none text-sm" disabled={loading} />
                            <button type="button" onClick={sendMessage} disabled={!input.trim() || loading} className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] disabled:opacity-50" aria-label="Enviar consulta"><Send className="size-4" /></button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
