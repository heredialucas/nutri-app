"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export function LandingBookingCta() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="reservar" className="py-[clamp(80px,14vh,160px)] px-[clamp(20px,5vw,80px)] bg-[#fafaf8]">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <p className="uppercase tracking-[0.3em] text-[#999] text-xs font-medium mb-6 m-0">
          Reservá tu turno
        </p>
        <h2 className="text-[clamp(2rem,5vw,4rem)] font-bold text-[#1a1a1a] leading-tight m-0 mb-6">
          Dale el primer paso
        </h2>
        <p className="text-[#666] text-[clamp(0.95rem,1.5vw,1.15rem)] leading-relaxed max-w-xl mx-auto m-0 mb-10">
          Reservá online en segundos. Elegí el tipo de consulta, completá tus datos
          y seleccioná el horario que mejor te quede.
        </p>

        <Link
          href="/reservar"
          className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white uppercase tracking-[0.1em] cursor-pointer rounded-[50px] px-10 py-4 text-sm font-semibold transition-all duration-300 hover:bg-[#333] no-underline"
        >
          <span>Reservar ahora</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="text-[#999] text-xs mt-6 m-0">
          Sin compromiso. Primer contacto en menos de 24hs.
        </p>
      </motion.div>
    </section>
  );
}
