"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DatosForm() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "IN_PERSON";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Tus datos
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Completá tus datos para continuar con la reserva.
      </p>

      <form className="flex flex-col gap-5">
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
              className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
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
              className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
            Teléfono *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
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
            className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
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
            className="px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a] resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="billingType" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
            Obra social / Particular
          </label>
          <select
            id="billingType"
            name="billingType"
            className="h-11 px-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          >
            <option value="particular">Particular</option>
            <option value="obra_social">Obra social</option>
          </select>
        </div>

        <div className="flex gap-3 mt-4">
          <Link
            href="/reservar"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
          >
            Volver
          </Link>
          <Link
            href={`/reservar/horario?type=${type}`}
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold no-underline transition-colors hover:bg-[#333] flex-1"
          >
            Continuar
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function DatosPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#999]">Cargando...</div>}>
      <DatosForm />
    </Suspense>
  );
}
