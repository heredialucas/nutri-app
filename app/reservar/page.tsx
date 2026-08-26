"use client";

import { Building2, Video } from "lucide-react";
import { useBooking } from "@/components/booking/booking-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const types = [
  {
    id: "IN_PERSON" as const,
    title: "Presencial",
    description: "En el consultorio, con mediciones antropométricas y evaluación completa.",
    icon: Building2,
  },
  {
    id: "ONLINE" as const,
    title: "Online",
    description: "Por videollamada, con la misma cercanía y calidad.",
    icon: Video,
  },
];

export default function ReservarPage() {
  const { setStep1, prefill, loggedPatient } = useBooking();
  const router = useRouter();
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (loggedPatient && !prefilledRef.current) {
      prefilledRef.current = true;
      router.replace("/reservar/horario");
    }
  }, [loggedPatient, router]);

  if (loggedPatient) {
    return (
      <div className="text-center py-12 text-sm text-[#999]">
        Redirigiendo a selección de horario...
      </div>
    );
  }

  const handleSelect = (type: "ONLINE" | "IN_PERSON") => {
    setStep1(type);
    router.push("/reservar/datos");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        ¿Qué tipo de consulta necesitás?
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Elegí la opción que mejor se adapte a tu situación.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className="group flex flex-col items-center gap-5 p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white transition-all duration-300 hover:border-[rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center transition-colors duration-300 group-hover:bg-[rgba(0,0,0,0.06)]">
                <Icon size={24} strokeWidth={1.5} className="text-[#1a1a1a]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] m-0 mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-[#666] m-0 leading-relaxed">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
