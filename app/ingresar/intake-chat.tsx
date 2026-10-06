"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Building2,
    CalendarDays,
    CheckCircle2,
    Loader2,
    MapPin,
    Send,
    Video,
} from "lucide-react";
import {
    createPublicBooking,
    getActiveAppointmentByDni,
    getPublicAvailableSlots,
    getPublicLocations,
    lookupMemberByDni,
} from "@/app/actions/public-booking";
import { isValidDni, normalizeDni } from "@/lib/dni";

interface PublicLocation {
    id: string;
    name: string;
    address: string;
}

interface PendingAppointment {
    id: string;
    dateLabel: string;
    timeLabel: string;
    typeLabel: string;
    locationLabel: string | null;
}

type Step =
    | "modality"
    | "location"
    | "dni"
    | "name"
    | "existing"
    | "slots"
    | "confirm"
    | "done";

interface Msg {
    id: number;
    role: "bot" | "user";
    text: string;
}

interface IntakeChatProps {
    location: PublicLocation | null;
}

function todayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function IntakeChat({ location }: IntakeChatProps) {
    const router = useRouter();
    const idRef = useRef(0);
    const startedRef = useRef(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const [messages, setMessages] = useState<Msg[]>([]);
    const [step, setStep] = useState<Step>("modality");
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [dni, setDni] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [member, setMember] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        birthDate?: string;
    }>({});

    const [mode, setMode] = useState<"ONLINE" | "IN_PERSON" | null>(null);
    const [locationId, setLocationId] = useState<string>(location?.id ?? "");
    const [locationName, setLocationName] = useState<string>(location?.name ?? "");
    const [locationAddress, setLocationAddress] = useState<string>(location?.address ?? "");

    const [locations, setLocations] = useState<PublicLocation[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const [pendingAppointment, setPendingAppointment] = useState<PendingAppointment | null>(null);
    const [replaceExisting, setReplaceExisting] = useState(false);

    const [selectedDate, setSelectedDate] = useState(todayString());
    const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ accountCreated: boolean } | null>(null);
    const [doneKind, setDoneKind] = useState<"booked" | "kept">("booked");

    const push = (role: Msg["role"], text: string) => {
        setMessages((prev) => [...prev, { id: idRef.current++, role, text }]);
    };

    const pushBot = (text: string) => push("bot", text);
    const pushUser = (text: string) => push("user", text);

    // Arranque de la conversación
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        if (location) {
            setMode("IN_PERSON");
            pushBot(
                `¡Hola! Soy el asistente de Mauro Acosta. Estás reservando en ${location.name}.`,
            );
            pushBot("¿Cuál es tu DNI?");
            setStep("dni");
        } else {
            pushBot("¡Hola! Soy el asistente de Mauro Acosta. ¿Cómo querés atenderte?");
            setStep("modality");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, step, slots, loadingSlots]);

    const goToDni = () => {
        pushBot("¿Cuál es tu DNI?");
        setStep("dni");
    };

    const startSlots = () => {
        pushBot("Perfecto. Elegí el día y el horario que mejor te quede.");
        setStep("slots");
    };

    const continueAfterDni = () => {
        if (!mode) {
            pushBot("¿Cómo querés atenderte?");
            setStep("modality");
            return;
        }
        if (member.firstName && member.lastName) {
            setFirstName(member.firstName);
            setLastName(member.lastName);
            startSlots();
            return;
        }
        pushBot("¿Cuál es tu nombre y apellido?");
        setStep("name");
    };

    const submitDni = async () => {
        const value = normalizeDni(input);
        if (!isValidDni(value)) {
            setError("Ingresá un DNI válido (7 u 8 dígitos).");
            return;
        }
        setError(null);
        pushUser(value);
        setDni(value);
        setInput("");

        try {
            const found = await lookupMemberByDni(value);
            if (found) {
                setMember({
                    firstName: found.firstName,
                    lastName: found.lastName,
                    email: found.email,
                    phone: found.phone,
                    birthDate: found.birthDate,
                });
                if (found.firstName) setFirstName(found.firstName);
                if (found.lastName) setLastName(found.lastName);
                if (found.firstName && found.lastName) {
                    pushBot(`Te encontré en el padrón: ${found.firstName} ${found.lastName}.`);
                }
            }
        } catch {
            // silencioso: el padrón es opcional
        }

        // Regla: un solo turno activo por DNI
        try {
            const pending = await getActiveAppointmentByDni(value);
            if (pending) {
                setPendingAppointment(pending);
                pushBot(
                    `Ya tenés un turno reservado para el ${pending.dateLabel} a las ${pending.timeLabel} (${pending.typeLabel}).`,
                );
                pushBot("¿Querés cambiarlo por otro horario?");
                setStep("existing");
                return;
            }
        } catch {
            // si falla la consulta, se continúa con la reserva normal
        }

        continueAfterDni();
    };

    const submitName = () => {
        const f = firstName.trim();
        const l = lastName.trim();
        if (!f || !l) {
            setError("Completá tu nombre y tu apellido.");
            return;
        }
        setError(null);
        pushUser(`${f} ${l}`);
        startSlots();
    };

    const handleReschedule = () => {
        pushUser("Sí, quiero cambiarlo");
        setReplaceExisting(true);
        continueAfterDni();
    };

    const handleKeep = () => {
        pushUser("No, mantener el actual");
        setDoneKind("kept");
        setStep("done");
    };

    // Cargar horarios cuando entramos al paso de slots o cambia la fecha
    useEffect(() => {
        if (step !== "slots") return;
        let active = true;
        setLoadingSlots(true);
        setSlotsError(null);
        setSelectedTime(null);

        getPublicAvailableSlots(
            selectedDate,
            mode === "IN_PERSON" ? locationId : null,
            dni,
            member.email,
        )
            .then((result) => {
                if (!active) return;
                setSlots(result);
                if (result.length === 0) {
                    setSlotsError("No hay horarios para ese día. Probá otra fecha.");
                }
            })
            .catch(() => {
                if (active) setSlotsError("No pudimos cargar los horarios. Reintentá.");
            })
            .finally(() => {
                if (active) setLoadingSlots(false);
            });

        return () => {
            active = false;
        };
    }, [step, selectedDate, mode, locationId, dni, member.email]);

    const confirmSlot = () => {
        if (!selectedTime) return;
        pushUser(`${selectedDate} · ${selectedTime} hs`);
        pushBot("Revisá los datos y confirmá tu turno.");
        setStep("confirm");
    };

    const submitBooking = async () => {
        if (!mode) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await createPublicBooking({
                firstName,
                lastName,
                dni,
                email: member.email,
                phone: member.phone,
                birthDate: member.birthDate,
                type: mode,
                locationId: mode === "IN_PERSON" ? locationId : undefined,
                date: selectedDate,
                time: selectedTime!,
                replaceExisting,
            });
            setResult({ accountCreated: !!res?.accountCreated });
            setDoneKind("booked");
            pushBot(
                replaceExisting
                    ? "¡Listo! Tu turno quedó actualizado. Te esperamos."
                    : "¡Listo! Tu turno quedó registrado. Te esperamos.",
            );
            setStep("done");
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "No pudimos confirmar el turno.";
            setError(msg);
            pushBot(`No pude confirmar: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const chooseModality = (value: "ONLINE" | "IN_PERSON") => {
        setMode(value);
        pushUser(value === "IN_PERSON" ? "Presencial" : "Online");
        if (value === "ONLINE") {
            goToDni();
        } else {
            setLoadingLocations(true);
            getPublicLocations()
                .then((list) => {
                    setLocations(list);
                    if (list.length === 0) {
                        pushBot("Todavía no hay sedes disponibles. Probá con la modalidad online.");
                        setStep("modality");
                        setMode(null);
                    } else {
                        pushBot("¿En qué sede querés atenderte?");
                        setStep("location");
                    }
                })
                .catch(() => {
                    setError("No pudimos cargar las sedes.");
                })
                .finally(() => setLoadingLocations(false));
        }
    };

    const chooseLocation = (loc: PublicLocation) => {
        setLocationId(loc.id);
        setLocationName(loc.name);
        setLocationAddress(loc.address);
        pushUser(loc.name);
        goToDni();
    };

    const resetAll = () => {
        setMessages([]);
        setDni("");
        setFirstName("");
        setLastName("");
        setMember({});
        setMode(location ? "IN_PERSON" : null);
        setLocationId(location?.id ?? "");
        setLocationName(location?.name ?? "");
        setLocationAddress(location?.address ?? "");
        setPendingAppointment(null);
        setReplaceExisting(false);
        setSelectedDate(todayString());
        setSlots([]);
        setSelectedTime(null);
        setResult(null);
        setError(null);
        setDoneKind("booked");
        if (location) {
            pushBot(`Estás reservando en ${location.name}.`);
            pushBot("¿Cuál es tu DNI?");
            setStep("dni");
        } else {
            pushBot("¿Cómo querés atenderte?");
            setStep("modality");
        }
    };

    const minDate = todayString();

    return (
        <div className="min-h-screen bg-[#fafaf8] flex flex-col">
            <header className="border-b border-[rgba(0,0,0,0.06)] bg-white">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <Link href="/" aria-label="Ir al inicio" className="flex items-center no-underline shrink-0">
                        <Image
                            src="/images/iconMauroAcosta.png"
                            alt="Mauro Acosta"
                            width={688}
                            height={363}
                            priority
                            className="h-8 w-auto"
                        />
                    </Link>
                    <span className="text-xs text-[#999]">
                        {location ? location.name : "Reserva de turnos"}
                    </span>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
                <div className="flex-1 flex flex-col gap-3">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                m.role === "bot"
                                    ? "self-start bg-white border border-[rgba(0,0,0,0.06)] text-[#1a1a1a] rounded-bl-sm"
                                    : "self-end bg-[#1a1a1a] text-white rounded-br-sm"
                            }`}
                        >
                            {m.text}
                        </div>
                    ))}

                    {location && step !== "done" && (
                        <div className="self-start flex items-start gap-1.5 text-xs text-[#999] px-1">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            <span>
                                {location.name} — {location.address}
                            </span>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {error && <p className="text-sm text-red-500 m-0">{error}</p>}

                {/* Área de interacción según el paso */}
                <div className="border-t border-[rgba(0,0,0,0.06)] pt-4">
                    {step === "modality" && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => chooseModality("IN_PERSON")}
                                disabled={loadingLocations}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white hover:border-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-60"
                            >
                                <Building2 size={20} strokeWidth={1.5} />
                                <span className="text-sm font-medium">Presencial</span>
                            </button>
                            <button
                                onClick={() => chooseModality("ONLINE")}
                                disabled={loadingLocations}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white hover:border-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-60"
                            >
                                <Video size={20} strokeWidth={1.5} />
                                <span className="text-sm font-medium">Online</span>
                            </button>
                        </div>
                    )}

                    {step === "location" && (
                        <div className="flex flex-col gap-2">
                            {locations.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => chooseLocation(loc)}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white text-left hover:border-[#1a1a1a] transition-colors cursor-pointer"
                                >
                                    <Building2 size={18} strokeWidth={1.5} className="shrink-0" />
                                    <span>
                                        <span className="block text-sm font-medium text-[#1a1a1a]">{loc.name}</span>
                                        <span className="block text-xs text-[#666]">{loc.address}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === "dni" && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitDni();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                autoFocus
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                inputMode="numeric"
                                placeholder="Tu DNI, sin puntos"
                                className="h-11 flex-1 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
                            />
                            <button
                                type="submit"
                                className="h-11 w-11 shrink-0 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#333] transition-colors cursor-pointer"
                                aria-label="Enviar"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    )}

                    {step === "name" && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitName();
                            }}
                            className="flex flex-col gap-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    autoFocus
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Nombre"
                                    autoComplete="given-name"
                                    className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
                                />
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Apellido"
                                    autoComplete="family-name"
                                    className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
                                />
                            </div>
                            <button
                                type="submit"
                                className="h-11 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors cursor-pointer"
                            >
                                Continuar
                            </button>
                        </form>
                    )}

                    {step === "existing" && pendingAppointment && (
                        <div className="flex flex-col gap-3">
                            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 text-sm flex flex-col gap-2">
                                <Row label="Fecha" value={pendingAppointment.dateLabel} />
                                <Row label="Horario" value={`${pendingAppointment.timeLabel} hs`} />
                                <Row label="Modalidad" value={pendingAppointment.typeLabel} />
                                {pendingAppointment.locationLabel && (
                                    <Row label="Sede" value={pendingAppointment.locationLabel} />
                                )}
                            </div>
                            <button
                                onClick={handleReschedule}
                                className="h-11 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors cursor-pointer"
                            >
                                Sí, cambiar el turno
                            </button>
                            <button
                                onClick={handleKeep}
                                className="h-11 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer"
                            >
                                No, mantener el actual
                            </button>
                        </div>
                    )}

                    {step === "slots" && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em] flex items-center gap-1.5">
                                    <CalendarDays size={13} /> Fecha
                                </label>
                                <input
                                    type="date"
                                    min={minDate}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a] w-full max-w-[260px]"
                                />
                            </div>

                            {loadingSlots ? (
                                <div className="flex items-center gap-2 text-sm text-[#999] py-4">
                                    <Loader2 size={16} className="animate-spin" /> Buscando horarios...
                                </div>
                            ) : slotsError ? (
                                <p className="text-sm text-[#999] m-0">{slotsError}</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            disabled={!slot.available}
                                            onClick={() => setSelectedTime(slot.time)}
                                            className={`h-11 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                                !slot.available
                                                    ? "border-[rgba(0,0,0,0.04)] bg-[rgba(0,0,0,0.02)] text-[#ccc] cursor-not-allowed"
                                                    : selectedTime === slot.time
                                                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                                                      : "border-[rgba(0,0,0,0.1)] bg-white text-[#1a1a1a] hover:border-[rgba(0,0,0,0.2)] cursor-pointer"
                                            }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-[#999] m-0">
                                La primera consulta dura 45 min. Zona horaria Argentina (GMT-3).
                            </p>

                            <button
                                onClick={confirmSlot}
                                disabled={!selectedTime}
                                className={`h-11 rounded-lg text-sm font-semibold transition-colors ${
                                    selectedTime
                                        ? "bg-[#1a1a1a] text-white hover:bg-[#333] cursor-pointer"
                                        : "bg-[rgba(0,0,0,0.06)] text-[#999] cursor-not-allowed"
                                }`}
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {step === "confirm" && (
                        <div className="flex flex-col gap-3">
                            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 text-sm flex flex-col gap-2">
                                <Row label="Nombre" value={`${firstName} ${lastName}`} />
                                <Row label="DNI" value={dni} />
                                <Row
                                    label="Modalidad"
                                    value={mode === "ONLINE" ? "Online" : "Presencial"}
                                />
                                {mode === "IN_PERSON" && locationName && (
                                    <Row label="Sede" value={`${locationName} — ${locationAddress}`} />
                                )}
                                <Row label="Fecha" value={selectedDate} />
                                <Row label="Horario" value={`${selectedTime} hs`} />
                                {replaceExisting && (
                                    <p className="text-xs text-[#eab308] m-0 pt-1">
                                        Se reemplazará tu turno anterior.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={submitBooking}
                                disabled={submitting}
                                className="h-11 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {submitting
                                    ? "Confirmando..."
                                    : replaceExisting
                                      ? "Confirmar cambio"
                                      : "Confirmar turno"}
                            </button>
                        </div>
                    )}

                    {step === "done" && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-[#22c55e] text-sm font-medium">
                                <CheckCircle2 size={18} />
                                {doneKind === "kept" ? "Turno vigente" : "Turno reservado"}
                            </div>
                            {doneKind === "kept" && pendingAppointment && (
                                <p className="text-sm text-[#666] m-0">
                                    Mantenemos tu turno del {pendingAppointment.dateLabel} a las{" "}
                                    {pendingAppointment.timeLabel} hs.
                                </p>
                            )}
                            <button
                                onClick={() =>
                                    router.push(
                                        doneKind === "booked" && !result?.accountCreated
                                            ? "/auth/login"
                                            : "/paciente/dashboard",
                                    )
                                }
                                className="h-11 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors cursor-pointer"
                            >
                                {doneKind === "booked" && !result?.accountCreated
                                    ? "Iniciar sesión"
                                    : "Ir a mi panel"}
                            </button>
                            <button
                                onClick={resetAll}
                                className="h-11 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer"
                            >
                                Reservar otro turno
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#999] uppercase tracking-[0.05em] shrink-0">{label}</span>
            <span className="text-sm font-medium text-[#1a1a1a] text-right break-words">{value}</span>
        </div>
    );
}
