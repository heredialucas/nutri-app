"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { needsLocation, useBooking } from "@/components/booking/booking-context";
import { createPublicBooking } from "@/app/actions/public-booking";
import { registerOrActivateAccount } from "@/app/actions/activation";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

const typeLabels: Record<string, string> = {
  IN_PERSON: "Consulta presencial",
  ONLINE: "Consulta online",
};

interface ConfirmedBooking {
  type: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  accountCreated: boolean;
  mustSetPassword: boolean;
  locationName?: string;
  locationAddress?: string;
}

function ConfirmacionContent() {
  const { data, loggedPatient } = useBooking();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const bookedRef = useRef(false);

  const isLoggedIn = !!loggedPatient;

  const needsSede = needsLocation(data);

  useEffect(() => {
    if (needsSede) {
      router.replace("/reservar/sede");
    }
  }, [needsSede, router]);

  const runBook = async (forceReplace = false) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await createPublicBooking({
        firstName: data.firstName,
        lastName: data.lastName,
        dni: data.dni,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birthDate: data.birthDate || undefined,
        goal: data.goal || undefined,
        type: data.type,
        locationId: data.type === "IN_PERSON" ? data.locationId : undefined,
        date: data.date,
        time: data.time,
        replaceExisting: forceReplace || data.replaceExisting,
      });
      setConfirmedBooking({
        type: data.type,
        date: data.date,
        time: data.time,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        dni: data.dni,
        accountCreated: !!result?.accountCreated,
        mustSetPassword: result?.mustSetPassword ?? true,
        locationName: data.locationName || undefined,
        locationAddress: data.locationAddress || undefined,
      });
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al crear el turno");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (status !== "loading" || bookedRef.current || needsSede) return;
    bookedRef.current = true;
    void runBook(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, status, needsSede]);

  const needsActivation = !isLoggedIn && !!confirmedBooking?.mustSetPassword;

  const loginWithDniHref = confirmedBooking
    ? `/auth/login?${new URLSearchParams({
        dni: confirmedBooking.dni,
        callbackUrl: "/paciente/dashboard",
      }).toString()}`
    : "/auth/login";

  const handleInlineActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedBooking) return;
    if (password.length < 8) {
      setActivationError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== repeatPassword) {
      setActivationError("Las contraseñas no coinciden.");
      return;
    }
    setActivating(true);
    setActivationError(null);
    try {
      const res = await registerOrActivateAccount({
        dni: confirmedBooking.dni,
        firstName: confirmedBooking.firstName || "Paciente",
        lastName: confirmedBooking.lastName || "Nuevo",
        password,
      });
      if (res?.error) {
        setActivationError(res.error);
        return;
      }
      router.push(res.redirectTo || "/paciente/dashboard");
      router.refresh();
    } catch (err) {
      setActivationError(
        err instanceof Error ? err.message : "No pudimos crear tu contraseña.",
      );
    } finally {
      setActivating(false);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Loader2 size={48} strokeWidth={1.5} className="text-[#1a1a1a] animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
          Reservando tu turno...
        </h1>
        <p className="text-sm text-[#666] m-0">
          Estamos registrando tu reserva.
        </p>
      </div>
    );
  }

  if (status === "error") {
    const canReplaceExisting = errorMsg.includes("Ya tenés un turno reservado");
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle size={48} strokeWidth={1.5} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
          {canReplaceExisting ? "Ya tenés un turno activo" : "No se pudo reservar"}
        </h1>
        <p className="text-sm text-[#666] mb-8 m-0 max-w-md mx-auto">
          {errorMsg}
        </p>
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {canReplaceExisting && (
            <button
              onClick={() => runBook(true)}
              className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold transition-colors hover:bg-[#333] cursor-pointer"
            >
              Reemplazar mi turno anterior por este horario
            </button>
          )}
          <Link
            href="/reservar/horario"
            className={`inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-semibold no-underline transition-colors ${
              canReplaceExisting
                ? "border border-[rgba(0,0,0,0.1)] text-[#1a1a1a] hover:bg-[rgba(0,0,0,0.02)]"
                : "bg-[#1a1a1a] text-white hover:bg-[#333]"
            }`}
          >
            Elegir otro horario
          </Link>
          {isLoggedIn && (
            <Link
              href="/paciente/dashboard"
              className="inline-flex items-center justify-center h-11 px-8 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
            >
              Ir a mi panel
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = formatInTimeZone(
    new Date(confirmedBooking!.date + "T12:00:00"),
    AR_TZ,
    "EEEE d 'de' MMMM",
    { locale: es },
  );

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle2 size={56} strokeWidth={1.2} className="text-[#22c55e]" />
      </div>

      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Turno reservado
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0 max-w-md mx-auto">
        {isLoggedIn
          ? "Tu turno quedó reservado. Mauro lo va a confirmar y te contactaremos por WhatsApp al número que dejaste."
          : needsActivation
            ? "Tu turno quedó reservado. Creá tu contraseña para gestionarlo; Mauro lo confirmará y te contactaremos por WhatsApp."
            : "Tu turno quedó reservado. Iniciá sesión con tu DNI para gestionarlo; Mauro lo confirmará y te contactaremos por WhatsApp."}
      </p>

      <div className="w-full max-w-md mx-auto flex flex-col gap-3 p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-left mb-8">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em] shrink-0">Tipo</span>
          <span className="text-sm font-medium text-[#1a1a1a] text-right break-words">{typeLabels[confirmedBooking!.type] || confirmedBooking!.type}</span>
        </div>
        {confirmedBooking!.type === "IN_PERSON" && confirmedBooking!.locationName && (
          <>
            <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#999] uppercase tracking-[0.05em] shrink-0">Sede</span>
              <span className="text-sm font-medium text-[#1a1a1a] text-right break-words">
                {confirmedBooking!.locationName}
                {confirmedBooking!.locationAddress ? ` — ${confirmedBooking!.locationAddress}` : ""}
              </span>
            </div>
          </>
        )}
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em] shrink-0">Fecha</span>
          <span className="text-sm font-medium text-[#1a1a1a] capitalize text-right break-words">{formattedDate}</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em] shrink-0">Horario</span>
          <span className="text-sm font-medium text-[#1a1a1a] text-right">{confirmedBooking!.time} hs</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em] shrink-0">Estado</span>
          <span className="text-sm font-medium text-[#eab308] text-right">Pendiente de confirmación por el profesional</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {needsActivation ? (
          <form
            onSubmit={handleInlineActivation}
            className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-5 flex flex-col gap-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a] m-0 mb-1">
                Creá tu contraseña para entrar a tu panel
              </p>
              <p className="text-xs text-[#666] m-0">
                Vas a ingresar siempre con tu DNI ({confirmedBooking!.dni}) y esta contraseña para gestionar tus turnos.
              </p>
            </div>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña (mínimo 8 caracteres)"
              className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
            />
            <input
              type="password"
              required
              minLength={8}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder="Repetir contraseña"
              className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
            />
            {activationError && (
              <p className="text-xs text-red-500 m-0">{activationError}</p>
            )}
            <button
              type="submit"
              disabled={activating}
              className="h-11 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {activating && <Loader2 size={16} className="animate-spin" />}
              {activating ? "Guardando..." : "Guardar contraseña e ir a mi panel"}
            </button>
          </form>
        ) : (
          <button
            onClick={() =>
              router.push(isLoggedIn ? "/paciente/dashboard" : loginWithDniHref)
            }
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold transition-colors hover:bg-[#333] cursor-pointer"
          >
            {isLoggedIn ? "Ir a mi panel" : "Iniciar sesión e ir a mi panel"}
          </button>
        )}
        <button
          onClick={handleGoHome}
          className="inline-flex items-center justify-center h-11 px-8 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] transition-colors hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#999]">Cargando...</div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}
