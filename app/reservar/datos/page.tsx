"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/components/booking/booking-context";
import { useState } from "react";

export default function DatosPage() {
  const { data, setStep2 } = useBooking();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    birthDate: data.birthDate,
    goal: data.goal,
    billingType: data.billingType,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2(form);
    router.push("/reservar/horario");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Tus datos
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Completá tus datos para continuar con la reserva.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              value={form.lastName}
              onChange={handleChange}
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
            value={form.email}
            onChange={handleChange}
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
            value={form.phone}
            onChange={handleChange}
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
            value={form.birthDate}
            onChange={handleChange}
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
            value={form.goal}
            onChange={handleChange}
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
            value={form.billingType}
            onChange={handleChange}
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
