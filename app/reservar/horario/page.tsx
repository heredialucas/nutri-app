"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { getPublicAvailableSlots } from "@/app/actions/public-booking";
import { CalendarDays, Loader2 } from "lucide-react";

interface HorarioFormProps {
  loggedPatient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    billingType: string;
  } | null;
}

function HorarioForm({ loggedPatient }: HorarioFormProps) {
  const { data, setStep3 } = useBooking();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(data.time || null);
  const [selectedDate, setSelectedDate] = useState<string>(
    data.date || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    })()
  );
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSlots() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPublicAvailableSlots(selectedDate);
        setSlots(result);
        if (result.length === 0) {
          setError("No hay horarios disponibles para esa fecha. Elegí otro día.");
        }
      } catch {
        setError("Error al cargar horarios. Intentá de nuevo.");
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, [selectedDate]);

  const handleContinue = () => {
    if (!selected) return;
    setStep3(selectedDate, selected);
    router.push("/reservar/confirmacion");
  };

  const minDate = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Elegí fecha y horario
      </h1>
      <p className="text-sm text-[#666] mb-6 m-0">
        Seleccioná el día y luego el horario que mejor te quede.
      </p>

      <div className="flex flex-col gap-1.5 mb-6">
        <label htmlFor="date" className="text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]">
          Fecha del turno
        </label>
        <div className="relative">
          <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            id="date"
            type="date"
            min={minDate}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelected(null);
            }}
            className="h-11 pl-10 pr-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a] w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-[#999]">
          <Loader2 size={16} className="animate-spin" />
          Cargando horarios...
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#999] m-0">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
          {slots.map((slot) => (
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
      )}

      <p className="text-xs text-[#999] mb-6 m-0">
        Zona horaria: Argentina (GMT-3)
      </p>

      <div className="flex gap-3">
        <Link
          href={loggedPatient ? "/paciente/dashboard" : "/reservar/datos"}
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] no-underline transition-colors hover:bg-[rgba(0,0,0,0.02)]"
        >
          Volver
        </Link>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-semibold transition-colors flex-1 cursor-pointer ${
            selected
              ? "bg-[#1a1a1a] text-white hover:bg-[#333]"
              : "bg-[rgba(0,0,0,0.06)] text-[#999] cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

interface HorarioPageProps {
  loggedPatient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    billingType: string;
  } | null;
}

export default function HorarioPage({ loggedPatient }: HorarioPageProps) {
  return (
    <Suspense fallback={<div className="text-sm text-[#999]">Cargando...</div>}>
      <HorarioForm loggedPatient={loggedPatient} />
    </Suspense>
  );
}
