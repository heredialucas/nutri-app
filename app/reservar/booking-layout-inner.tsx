"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { BookingProvider } from "@/components/booking/booking-context";
import { getCurrentPatientData } from "@/app/actions/current-patient";
import type { LoggedPatient } from "@/components/booking/booking-context";

const steps = [
  { href: "/reservar", label: "Tipo" },
  { href: "/reservar/datos", label: "Datos" },
  { href: "/reservar/horario", label: "Horario" },
  { href: "/reservar/confirmacion", label: "Confirmar" },
];

export default function BookingLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loggedPatient, setLoggedPatient] = useState<LoggedPatient | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getCurrentPatientData().then((data) => {
      setLoggedPatient(data);
      setReady(true);
    });
  }, []);

  const currentIndex = steps.findIndex((s) => pathname === s.href);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center text-sm text-[#999]">
        Cargando...
      </div>
    );
  }

  return (
    <BookingProvider loggedPatient={loggedPatient}>
      <div className="min-h-screen bg-[#fafaf8]">
        <header className="border-b border-[rgba(0,0,0,0.06)] bg-white">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-baseline gap-1 text-base font-semibold no-underline text-[#1a1a1a]"
            >
              <span>Mauro</span>
              <span className="text-[rgba(0,0,0,0.3)]">Acosta</span>
            </Link>
            <div className="flex items-center gap-3">
              {loggedPatient && (
                <Link
                  href="/paciente/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666] no-underline transition-colors hover:text-[#1a1a1a]"
                >
                  <LayoutDashboard size={14} />
                  Mi panel
                </Link>
              )}
              <span className="text-xs text-[#999] uppercase tracking-[0.15em]">
                Reservar turno
              </span>
            </div>
          </div>
        </header>

        <div className="border-b border-[rgba(0,0,0,0.04)] bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              {steps.map((step, i) => (
                <div key={step.href} className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= currentIndex
                        ? "bg-[#1a1a1a]"
                        : "bg-[rgba(0,0,0,0.06)]"
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, i) => (
                <span
                  key={step.href}
                  className={`text-[10px] uppercase tracking-[0.1em] ${
                    i <= currentIndex
                      ? "text-[#1a1a1a] font-medium"
                      : "text-[#999]"
                  }`}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-10">{children}</main>
      </div>
    </BookingProvider>
  );
}
