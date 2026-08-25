"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const availableSlots = [
  { time: "09:00", available: true },
  { time: "09:30", available: false },
  { time: "10:00", available: true },
  { time: "10:30", available: true },
  { time: "11:00", available: false },
  { time: "11:30", available: true },
  { time: "14:00", available: true },
  { time: "14:30", available: true },
  { time: "15:00", available: false },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "16:30", available: false },
];

function HorarioForm() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "IN_PERSON";
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Elegí un horario
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Horarios disponibles para consulta. Los turnos en gris ya están ocupados.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            disabled={!slot.available}
            onClick={() => setSelected(slot.time)}
            className={`h-12 rounded-lg border text-sm font-medium transition-all duration-200 ${
              !slot.available
                ? "border-[rgba(0,0,0,0.04)] bg-[rgba(0,0,0,0.02)] text-[#ccc] cursor-not-allowed"
                : selected === slot.time
                ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                : "border-[rgba(0,0,0,0.1)] bg-white text-[#1a1a1a] hover:border-[rgba(0,0,0,0.2)] cursor-pointer"
            }`}
          >
            {slot.time}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#999] mb-6 m-0">
        Zona horaria: Argentina (GMT-3)
      </p>

      <div className="flex gap-3">
        <Link
          href={`/reservar/datos?type=${type}`}
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
        >
          Volver
        </Link>
        <Link
          href={selected ? `/reservar/confirmacion?type=${type}&time=${selected}` : "#"}
          onClick={(e) => {
            if (!selected) e.preventDefault();
          }}
          className={`inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-semibold no-underline transition-colors flex-1 ${
            selected
              ? "bg-[#1a1a1a] text-white hover:bg-[#333]"
              : "bg-[rgba(0,0,0,0.06)] text-[#999] cursor-not-allowed pointer-events-none"
          }`}
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}

export default function HorarioPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#999]">Cargando...</div>}>
      <HorarioForm />
    </Suspense>
  );
}
