"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const typeLabels: Record<string, string> = {
  IN_PERSON: "Consulta presencial",
  ONLINE: "Consulta online",
};

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "IN_PERSON";
  const time = searchParams.get("time") || "10:00";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle2 size={56} strokeWidth={1.2} className="text-[#22c55e]" />
      </div>

      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Reserva confirmada
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0 max-w-md mx-auto">
        Tu solicitud de turno fue enviada. Serás redirigido al panel en{" "}
        <span className="font-semibold text-[#1a1a1a]">{countdown}s</span>.
      </p>

      <div className="inline-flex flex-col gap-3 p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-left mb-8">
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Tipo</span>
          <span className="text-sm font-medium text-[#1a1a1a]">{typeLabels[type] || type}</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Horario</span>
          <span className="text-sm font-medium text-[#1a1a1a]">{time} hs</span>
        </div>
        <div className="w-full h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex justify-between gap-8">
          <span className="text-xs text-[#999] uppercase tracking-[0.05em]">Estado</span>
          <span className="text-sm font-medium text-[#eab308]">Pendiente de confirmación</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold no-underline transition-colors hover:bg-[#333]"
        >
          Ir al panel
        </Link>
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

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#999]">Cargando...</div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}
