"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/components/booking/booking-context";
import { updateMyProfile } from "@/app/actions/patient-portal";
import { useState, useEffect } from "react";

const isComplete = (v: string, placeholder?: string) =>
  !!v && v.trim() !== "" && v.trim() !== placeholder;

export default function DatosPage() {
  const { data, setStep2, loggedPatient } = useBooking();
  const router = useRouter();

  const requiredComplete = !!(
    loggedPatient &&
    isComplete(data.dni) &&
    isComplete(data.firstName, "Sin nombre") &&
    isComplete(data.lastName, "Sin apellido")
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2({ ...form, billingType: data.billingType || "particular" });
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
        Solo necesitamos tu DNI y tu nombre. El resto podés completarlo más
        adelante desde tu panel.
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
              <label htmlFor="phone" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
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
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
