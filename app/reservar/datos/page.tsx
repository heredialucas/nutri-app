"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/components/booking/booking-context";
import { updateMyProfile } from "@/app/actions/patient-portal";
import {
  getActiveAppointmentByDni,
  lookupMemberByDni,
} from "@/app/actions/public-booking";
import { isValidDni, normalizeDni } from "@/lib/dni";
import { useState, useEffect, useRef } from "react";

const isComplete = (v: string, placeholder?: string) =>
  !!v && v.trim() !== "" && v.trim() !== placeholder;

interface ActiveAppointmentInfo {
  id: string;
  dateLabel: string;
  timeLabel: string;
  typeLabel: string;
  locationLabel: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  mustSetPassword: boolean;
  isLoggedIn: boolean;
}

export default function DatosPage() {
  const { data, setStep2, loggedPatient } = useBooking();
  const router = useRouter();

  const requiredComplete = !!(
    loggedPatient &&
    isComplete(data.dni) &&
    isComplete(data.firstName, "Sin nombre") &&
    isComplete(data.lastName, "Sin apellido") &&
    isComplete(data.phone)
  );

  const nextHref = "/reservar/confirmacion";

  useEffect(() => {
    if (requiredComplete) {
      router.replace(nextHref);
    }
  }, [requiredComplete, nextHref, router]);

  const [form, setForm] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    dni: data.dni,
    email: data.email,
    phone: data.phone,
    birthDate: data.birthDate,
    goal: data.goal,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [activeAppointment, setActiveAppointment] =
    useState<ActiveAppointmentInfo | null>(null);
  const lastLookedUpDni = useRef<string>("");

  useEffect(() => {
    const normalized = normalizeDni(form.dni);
    if (!isValidDni(normalized)) {
      setActiveAppointment(null);
      return;
    }
    if (lastLookedUpDni.current === normalized) return;

    const timer = setTimeout(async () => {
      lastLookedUpDni.current = normalized;
      try {
        const [found, pending] = await Promise.all([
          lookupMemberByDni(normalized),
          getActiveAppointmentByDni(normalized),
        ]);
        if (found) {
          setForm((prev) => ({
            ...prev,
            firstName: prev.firstName || found.firstName || "",
            lastName: prev.lastName || found.lastName || "",
            phone: prev.phone || found.phone || "",
            email: prev.email || found.email || "",
            birthDate: prev.birthDate || found.birthDate || "",
          }));
        }
        setActiveAppointment(pending);
      } catch {
        // silencioso
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.dni]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleKeepExisting = () => {
    if (!activeAppointment) return;
    const normalized = normalizeDni(form.dni);
    if (activeAppointment.isLoggedIn || loggedPatient) {
      router.push("/paciente/dashboard");
      return;
    }
    if (activeAppointment.mustSetPassword) {
      const params = new URLSearchParams({
        dni: normalized,
        firstName: form.firstName || activeAppointment.firstName,
        lastName: form.lastName || activeAppointment.lastName,
      });
      router.push(`/auth/sign-up?${params.toString()}`);
      return;
    }
    router.push(
      `/auth/login?${new URLSearchParams({
        dni: normalized,
        callbackUrl: "/paciente/dashboard",
      }).toString()}`,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 6) {
      setFormError("Ingresá un número de celular válido.");
      return;
    }
    setFormError(null);
    setStep2({ ...form, replaceExisting: !!activeAppointment });
    if (loggedPatient) {
      updateMyProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        documentNumber: form.dni,
        email: form.email || undefined,
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
      }).catch(() => {});
    }
    router.push(nextHref);
  };

  if (requiredComplete) {
    return (
      <div className="text-center py-12 text-sm text-[#999]">
        Redirigiendo a la confirmación...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Casi listo
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Necesitamos tu DNI, tu nombre y tu celular. El resto podés completarlo
        más adelante desde tu panel.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dni" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
            DNI *
          </label>
          <input
            id="dni"
            name="dni"
            type="text"
            inputMode="numeric"
            required
            value={form.dni}
            onChange={handleChange}
            placeholder="Sin puntos"
            className="h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
              Nombre *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={handleChange}
              className="h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
              Apellido *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={handleChange}
              className="h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
            Celular *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={handleChange}
            placeholder="Ej: 381 670-9189"
            className="h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
          <p className="text-xs text-[#999] m-0">
            Lo usamos para contactarte por WhatsApp si necesitamos avisarte algo.
          </p>
        </div>

        <details className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3">
          <summary className="text-sm font-medium text-[#1a1a1a] cursor-pointer">
            Agregar más datos (opcional)
          </summary>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="birthDate" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
                Fecha de nacimiento
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
                className="h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
                ¿Qué estás buscando?
              </label>
              <textarea
                id="goal"
                name="goal"
                rows={3}
                placeholder="Ej: bajar de peso, mejorar hábitos alimentarios, control médico..."
                value={form.goal}
                onChange={handleChange}
                className="px-4 py-3 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-base text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a] resize-none"
              />
            </div>
          </div>
        </details>

        {activeAppointment && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-amber-900 m-0">
              Ya tenés un turno reservado para el {activeAppointment.dateLabel} a las{" "}
              {activeAppointment.timeLabel} hs ({activeAppointment.typeLabel}).
            </p>
            <p className="text-xs text-amber-800 m-0">
              Si continuás con esta reserva, reemplazaremos tu turno anterior por el nuevo horario elegido.
            </p>
            <button
              type="button"
              onClick={handleKeepExisting}
              className="self-start text-xs font-semibold text-amber-900 underline underline-offset-4 cursor-pointer mt-1"
            >
              No quiero cambiarlo: mantener mi turno actual e ir a mi panel
            </button>
          </div>
        )}

        {formError && <p className="text-sm text-red-500 m-0">{formError}</p>}

        <div className="flex gap-3 mt-4">
          <Link
            href="/reservar/horario"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
          >
            Volver
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold transition-colors hover:bg-[#333] flex-1 cursor-pointer"
          >
            {activeAppointment ? "Reemplazar turno y continuar" : "Continuar"}
          </button>
        </div>
      </form>
    </div>
  );
}
