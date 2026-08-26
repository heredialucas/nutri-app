"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useBooking } from "@/components/booking/booking-context";
import { createPublicBooking } from "@/app/actions/public-booking";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

const typeLabels: Record<string, string> = {
  IN_PERSON: "Consulta presencial",
  ONLINE: "Consulta online",
};

function ConfirmacionContent() {
  const { data, isPrefilled, loggedPatient, reset } = useBooking();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [countdown, setCountdown] = useState(10);

  const bookedRef = useRef(false);

  const isLoggedIn = !!loggedPatient;

  useEffect(() => {
    if (status !== "loading" || bookedRef.current) return;
    bookedRef.current = true;

    async function book() {
      try {
        const result = await createPublicBooking({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          birthDate: data.birthDate || undefined,
          goal: data.goal || undefined,
          billingType: data.billingType,
          type: data.type,
          date: data.date,
          time: data.time,
        });
        setAppointmentId(result.appointment.id);
        setStatus("success");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error al crear el turno");
        setStatus("error");
      }
    }

    book();
  }, [data, status]);

  useEffect(() => {
    if (status !== "success") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isLoggedIn) {
            reset();
            router.push("/paciente/dashboard");
          } else {
            const params = new URLSearchParams({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
            });
            router.push(`/auth/sign-up?${params.toString()}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, router, data, isLoggedIn, reset]);

  const handlePrimaryAction = () => {
    reset();
    if (isLoggedIn) {
      router.push("/paciente/dashboard");
    } else {
      const params = new URLSearchParams({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
      router.push(`/auth/sign-up?${params.toString()}`);
    }
  };

  const handleGoHome = () => {
    reset();
    if (isLoggedIn) {
      router.push("/paciente/dashboard");
    } else {
      router.push("/");
    }
  };

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Loader2 size={48} strokeWidth={1.5} className="text-[#1a1a1a] animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
          Confirmando tu turno...
        </h1>
        <p className="text-sm text-[#666] m-0">
          Estamos procesando tu reserva.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle size={48} strokeWidth={1.5} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
          No se pudo confirmar
        </h1>
        <p className="text-sm text-[#666] mb-8 m-0 max-w-md mx-auto">
          {errorMsg}
        </p>
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Link
            href="/reservar/horario"
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold no-underline transition-colors hover:bg-[#333]"
          >
            Elegir otro horario
          </Link>
          <Link
            href={isLoggedIn ? "/paciente/dashboard" : "/"}
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
          >
            {isLoggedIn ? "Volver a mi panel" : "Volver al inicio"}
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = formatInTimeZone(
    new Date(data.date + "T12:00:00"),
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
          ? "Tu turno fue registrado correctamente."
          : "Tu turno fue registrado correctamente. Creá tu cuenta para gestionar tus turnos y ver tu historial."}
      </p>

      <div className="inline-flex flex-col gap-3 p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-left mb-8">
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Tipo</span>
          <span className="text-sm font-medium text-[#1a1a1a]">{typeLabels[data.type] || data.type}</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Fecha</span>
          <span className="text-sm font-medium text-[#1a1a1a] capitalize">{formattedDate}</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Horario</span>
          <span className="text-sm font-medium text-[#1a1a1a]">{data.time} hs</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Estado</span>
          <span className="text-sm font-medium text-[#eab308]">Pendiente de confirmación</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <button
          onClick={handlePrimaryAction}
          className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold transition-colors hover:bg-[#333] cursor-pointer"
        >
          {isLoggedIn ? "Ir a mi panel" : `Crear mi cuenta (${countdown}s)`}
        </button>
        <button
          onClick={handleGoHome}
          className="inline-flex items-center justify-center h-11 px-8 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] transition-colors hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
        >
          {isLoggedIn ? "Volver a mi panel" : "Volver al inicio"}
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
