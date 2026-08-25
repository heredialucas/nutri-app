"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Clock, FileText, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Privacidad total",
    description: "Tus datos clínicos están protegidos. Acceso solo por vos y tu profesional a cargo.",
  },
  {
    icon: Clock,
    title: "Agenda flexible",
    description: "Turnos presenciales y online. Elegí el horario que mejor se adapte a tu rutina.",
  },
  {
    icon: FileText,
    title: "Planes a medida",
    description: "Planes alimentarios personalizados, con recetas, listas de compras y seguimiento semanal.",
  },
  {
    icon: BarChart3,
    title: "Seguimiento de evolución",
    description: "Mediciones, fotos de progreso y gráficos para ver tu avance de forma clara y objetiva.",
  },
];

export function LandingFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-[clamp(60px,10vh,120px)] px-[clamp(20px,5vw,80px)] bg-[#fafaf8]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="uppercase tracking-[0.3em] text-[#999] text-xs font-medium mb-4 m-0">
            Beneficios
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#1a1a1a] leading-tight m-0 max-w-lg">
            Todo lo que necesitás, en un solo lugar
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(0,0,0,0.06)]">
          {features.map((feature, i) => {
            const cardRef = useRef(null);
            const cardInView = useInView(cardRef, { once: true, margin: "-60px" });

            return (
              <motion.div
                key={feature.title}
                ref={cardRef}
                initial={{ opacity: 0, y: 20 }}
                animate={cardInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-5 p-8 bg-white"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#f5f5f0] text-[#1a1a1a] shrink-0">
                  <feature.icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1a1a1a] m-0 mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed m-0">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
