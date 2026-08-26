"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Send,
    Trash2,
} from "lucide-react";

type Preferences = {
    notifTurnosHoy: boolean;
    notifTurnosManana: boolean;
    notifSeguimientosPendientes: boolean;
    notifPacientesInactivos: boolean;
    notifPlanDelDia: boolean;
    notifTurno24h: boolean;
    notifTurno2h: boolean;
    notifTipsRecetas: boolean;
    notifSeguimientoSemanal: boolean;
};

const DEFAULT_PREFS: Preferences = {
    notifTurnosHoy: true,
    notifTurnosManana: true,
    notifSeguimientosPendientes: true,
    notifPacientesInactivos: false,
    notifPlanDelDia: true,
    notifTurno24h: true,
    notifTurno2h: true,
    notifTipsRecetas: false,
    notifSeguimientoSemanal: true,
};

interface Props {
    role: "ADMIN" | "PATIENT";
}

export function WhatsAppSettingsForm({ role }: Props) {
    const [phone, setPhone] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState("");
    const [hasStored, setHasStored] = useState(false);
    const [checking, setChecking] = useState(true);
    const [testStatus, setTestStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [testMessage, setTestMessage] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/whatsapp/settings");
                const data = await res.json();
                if (data.hasSettings) {
                    setPhone(data.phone ?? "");
                    setEnabled(data.enabled);
                    if (data.preferences) {
                        setPrefs(data.preferences);
                    }
                    setHasStored(true);
                }
            } catch {
                // silent
            } finally {
                setChecking(false);
            }
        })();
    }, []);

    function togglePref(key: keyof Preferences) {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
        if (status !== "idle") setStatus("idle");
    }

    async function handleSave() {
        if (!phone.trim()) {
            setStatus("error");
            setMessage("El teléfono es obligatorio");
            return;
        }
        if (!apiKey.trim() && !hasStored) {
            setStatus("error");
            setMessage("La API key es obligatoria");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/whatsapp/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phone.trim(),
                    apiKey: apiKey.trim() || "___unchanged___",
                    enabled,
                    ...prefs,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Error al guardar");
            }

            setStatus("success");
            setMessage("Configuración guardada correctamente");
            setHasStored(true);
            setApiKey("");
        } catch (e) {
            setStatus("error");
            setMessage(
                e instanceof Error ? e.message : "Error al guardar",
            );
        }
    }

    async function handleDelete() {
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/whatsapp/settings", {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Error al borrar");
            }

            setStatus("success");
            setMessage("Configuración eliminada");
            setHasStored(false);
            setPhone("");
            setApiKey("");
            setEnabled(true);
            setPrefs(DEFAULT_PREFS);
        } catch (e) {
            setStatus("error");
            setMessage(
                e instanceof Error ? e.message : "Error al borrar",
            );
        }
    }

    async function handleTest() {
        setTestStatus("loading");
        setTestMessage("");

        try {
            const res = await fetch("/api/whatsapp/test", {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(
                    err.error ?? "Error al enviar prueba",
                );
            }

            setTestStatus("success");
            setTestMessage(
                "¡Mensaje de prueba enviado! Revisá tu WhatsApp.",
            );
        } catch (e) {
            setTestStatus("error");
            setTestMessage(
                e instanceof Error
                    ? e.message
                    : "Error al enviar prueba",
            );
        }
    }

    if (checking) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const proPrefs = [
        {
            key: "notifTurnosHoy" as const,
            label: "Turnos de hoy",
            desc: "Resumen de los turnos del día al abrir la app",
        },
        {
            key: "notifTurnosManana" as const,
            label: "Turnos de mañana",
            desc: "Resumen de los turnos del día siguiente",
        },
        {
            key: "notifSeguimientosPendientes" as const,
            label: "Seguimientos pendientes",
            desc: "Pacientes con check-in semanal sin completar",
        },
        {
            key: "notifPacientesInactivos" as const,
            label: "Pacientes inactivos",
            desc: "Pacientes sin turnos en los últimos 30 días",
        },
    ];

    const patientPrefs = [
        {
            key: "notifPlanDelDia" as const,
            label: "Plan del día",
            desc: "Todas las comidas de hoy según tu plan activo",
        },
        {
            key: "notifTurno24h" as const,
            label: "Turno en 24 horas",
            desc: "Recordatorio el día anterior a tu turno",
        },
        {
            key: "notifTurno2h" as const,
            label: "Turno en 2 horas",
            desc: "Recordatorio 2 horas antes de tu turno",
        },
        {
            key: "notifTipsRecetas" as const,
            label: "Tips y recetas del día",
            desc: "Recomendación nutricional personalizada",
        },
        {
            key: "notifSeguimientoSemanal" as const,
            label: "Seguimiento semanal",
            desc: "Recordatorio de completar tu check-in los lunes",
        },
    ];

    const currentPrefs = role === "PATIENT" ? patientPrefs : proPrefs;

    return (
        <div className="space-y-6 p-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                    Notificaciones por WhatsApp
                </h2>
                <p className="text-sm text-muted-foreground">
                    Recibí mensajes de WhatsApp automáticos cuando haya
                    novedades. Usa la API gratuita de CallMeBot.
                </p>
            </div>

            {hasStored && status !== "success" && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    Configuración de WhatsApp activa
                </div>
            )}

            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 space-y-2 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <p className="font-semibold">
                    Configuración inicial de CallMeBot (gratis)
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                        Agregá el número{" "}
                        <strong>+34 684 770 005</strong> a tus
                        contactos de WhatsApp.
                    </li>
                    <li>
                        Enviále el siguiente mensaje:{" "}
                        <strong>
                            &quot;Autorizo callmebot a enviarme
                            mensajes&quot;
                        </strong>
                    </li>
                    <li>
                        Esperá a recibir la respuesta con tu{" "}
                        <strong>API Key</strong>. Si no llega en 2
                        minutos, intentá de nuevo pasadas 24 hs.
                    </li>
                    <li>
                        Ingresá tu teléfono (con código de país, ej:
                        5493816709189) y la API Key abajo.
                    </li>
                </ol>
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label htmlFor="wa-phone">
                        Teléfono (con código de país)
                    </Label>
                    <Input
                        id="wa-phone"
                        type="tel"
                        placeholder="Ej: 5493816709189"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            if (status !== "idle") setStatus("idle");
                        }}
                        autoComplete="tel"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Incluí código de país sin + ni espacios. Ej:
                        5493816709189
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="wa-apikey">
                        API Key de CallMeBot
                    </Label>
                    <div className="relative">
                        <Input
                            id="wa-apikey"
                            type={showApiKey ? "text" : "password"}
                            placeholder={
                                hasStored
                                    ? "•••••••• (dejá vacío para mantener la actual)"
                                    : "Tu API key"
                            }
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                if (status !== "idle")
                                    setStatus("idle");
                            }}
                            className="pr-10"
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowApiKey(!showApiKey)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showApiKey ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                    <span className="text-sm font-medium">
                        Notificaciones activadas
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => {
                            setEnabled(!enabled);
                            if (status !== "idle")
                                setStatus("idle");
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            enabled ? "bg-primary" : "bg-input"
                        }`}
                    >
                        <span
                            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                                enabled
                                    ? "translate-x-4"
                                    : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                    ¿Qué notificaciones querés recibir?
                </h3>
                <div className="space-y-2">
                    {currentPrefs.map((pref) => (
                        <label
                            key={pref.key}
                            className="flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={prefs[pref.key]}
                                onChange={() => togglePref(pref.key)}
                                className="mt-0.5 rounded border-input"
                            />
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium">
                                    {pref.label}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    {pref.desc}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    {message}
                </div>
            )}

            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={status === "loading"}
                        className="flex-1"
                    >
                        {status === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MessageSquare className="h-4 w-4" />
                        )}
                        <span>
                            {hasStored ? "Actualizar" : "Guardar"}
                        </span>
                    </Button>

                    {hasStored && (
                        <Button
                            onClick={handleDelete}
                            disabled={status === "loading"}
                            variant="outline"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </Button>
                    )}
                </div>

                {hasStored && (
                    <div className="space-y-2">
                        <Button
                            onClick={handleTest}
                            disabled={testStatus === "loading"}
                            variant="secondary"
                            className="w-full"
                        >
                            {testStatus === "loading" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Enviar mensaje de prueba a mi WhatsApp
                        </Button>

                        {testStatus === "success" && (
                            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                                <CheckCircle className="h-4 w-4" />
                                {testMessage}
                            </div>
                        )}

                        {testStatus === "error" && (
                            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                                <AlertCircle className="h-4 w-4" />
                                {testMessage}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
