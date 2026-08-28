"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calculator } from "lucide-react";
import Lenis from "lenis";

export function LandingHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToCalculator = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector("#calculadora");
    if (!target) return;
    const w = window as unknown as { lenis?: Lenis };
    w.lenis?.scrollTo(target as HTMLElement, { offset: -80, duration: 1.4 });
  };

  return (
    <div className="relative w-full h-svh bg-[#0c0c0e] overflow-hidden">
      <motion.div
        className="w-full h-full relative"
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Imagen de fondo — cubre toda la altura, centrada horizontalmente */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            alt="Mauro Acosta - Gestión nutricional"
            src="/images/hero-mauro.jpg"
            className="h-full w-auto object-cover max-w-none"
            style={{ minHeight: "100%" }}
          />
        </div>

        {/* Degradé izquierdo: fusiona imagen con fondo oscuro */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: "linear-gradient(to right, #0c0c0e 0%, #0c0c0e 8%, rgba(12,12,14,0.7) 20%, transparent 40%)",
          }}
        />

        {/* Degradé derecho: fusiona imagen con fondo oscuro */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: "linear-gradient(to left, #0c0c0e 0%, #0c0c0e 8%, rgba(12,12,14,0.7) 20%, transparent 40%)",
          }}
        />

        {/* Degradé superior */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, #0c0c0e 0%, transparent 25%)",
          }}
        />

        {/* Degradé inferior:.da oscuro para texto legible */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: "linear-gradient(to top, #0c0c0e 0%, rgba(12,12,14,0.8) 15%, transparent 50%)",
          }}
        />

        {/* Film Grain sutil */}
        <div
          className="absolute inset-0 z-[4] pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundSize: "256px 256px",
          }}
        />

        {/* Contenido del hero */}
        <div className="relative z-[5] w-full h-full flex flex-col justify-end pb-[clamp(60px,10vh,120px)] px-[clamp(20px,5vw,80px)]">

          {/* Tagline superior */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <p className="uppercase tracking-[0.35em] text-[rgba(255,255,255,0.5)] text-[clamp(0.55rem,1vw,0.7rem)] font-normal m-0">
              Consultorio de gestión nutricional
            </p>
          </motion.div>

          {/* Título principal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-white text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.02em] m-0">
              Mauro Acosta
            </h1>
          </motion.div>

          {/* Subtítulo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-[clamp(300px,40vw,500px)]"
          >
            <p className="text-[rgba(255,255,255,0.6)] text-[clamp(0.9rem,1.8vw,1.3rem)] font-light leading-relaxed m-0">
              Atención personalizada en consultorio y online.
              <br />
              Tu bienestar es mi prioridad.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4 mt-10"
          >
            <a
              href="#calculadora"
              onClick={scrollToCalculator}
              className="inline-flex items-center gap-2.5 rounded-[50px] border cursor-pointer no-underline uppercase tracking-[0.1em] bg-emerald-500/15 border-emerald-400/40 text-emerald-300 px-[clamp(20px,2.5vw,32px)] py-[clamp(12px,1.5vw,16px)] text-[clamp(11px,1.1vw,13px)] font-semibold transition-all duration-300 hover:bg-emerald-500/25 hover:border-emerald-300/60"
            >
              <Calculator size={14} strokeWidth={2} />
              <span>Calculadora gratuita</span>
            </a>

            <Link
              href="/reservar"
              className="inline-flex items-center gap-2.5 bg-white text-[#0c0c0e] uppercase tracking-[0.1em] cursor-pointer rounded-[50px] px-[clamp(20px,2.5vw,32px)] py-[clamp(12px,1.5vw,16px)] text-[clamp(11px,1.1vw,13px)] font-semibold transition-all duration-300 hover:bg-white/90 no-underline"
            >
              <span>Reservar turno</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 backdrop-blur-xl text-white uppercase tracking-[0.1em] cursor-pointer bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-[50px] px-[clamp(20px,2.5vw,32px)] py-[clamp(12px,1.5vw,16px)] text-[clamp(11px,1.1vw,13px)] font-medium transition-all duration-300 hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.35)] no-underline"
            >
              <span>Iniciar sesión</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Marquee inferior */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-0 left-0 w-full z-[5] overflow-hidden border-t border-[rgba(255,255,255,0.06)]"
        >
          <div className="whitespace-nowrap will-change-transform w-max flex animate-[marquee_25s_linear_infinite] py-4">
            <span className="inline-block text-[rgba(255,255,255,0.15)] font-light text-[clamp(0.7rem,1.2vw,1rem)] tracking-[0.15em] pr-8">
              GESTIÓN NUTRICIONAL &mdash; PACIENTES &mdash; TURNOS &mdash; PLANES ALIMENTARIOS &mdash; SEGUIMIENTO &mdash; HISTORIA CLÍNICA &mdash;&nbsp;
            </span>
            <span className="inline-block text-[rgba(255,255,255,0.15)] font-light text-[clamp(0.7rem,1.2vw,1rem)] tracking-[0.15em] pr-8">
              GESTIÓN NUTRICIONAL &mdash; PACIENTES &mdash; TURNOS &mdash; PLANES ALIMENTARIOS &mdash; SEGUIMIENTO &mdash; HISTORIA CLÍNICA &mdash;&nbsp;
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
