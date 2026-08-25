"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Escucha activa",
    description: "Cada paciente es único. Primero escucho, entiendo tu historia, tus hábitos y tus objetivos.",
  },
  {
    number: "02",
    title: "Evaluación integral",
    description: "Análisis de antecedentes, mediciones antropométricas y evaluación del estado nutricional actual.",
  },
  {
    number: "03",
    title: "Plan personalizado",
    description: "Diseño un plan alimentario adaptado a tu vida, no a una dieta genérica. Flexible y sostenible.",
  },
  {
    number: "04",
    title: "Seguimiento continuo",
    description: "Controles regulares, ajustes y acompañamiento. No te dejo solo después de la primera consulta.",
  },
];

export function LandingApproach() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="como-trabajo" className="py-[clamp(60px,10vh,120px)] px-[clamp(20px,5vw,80px)] bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 text-center"
        >
          <p className="uppercase tracking-[0.3em] text-[#999] text-xs font-medium mb-4 m-0">
            Cómo trabajo
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#1a1a1a] leading-tight m-0">
            Un proceso claro, humano y efectivo
          </h2>
        </motion.div>

        {/* Layout alternado: izq-derecha */}
        <div className="flex flex-col gap-0">
          {steps.map((step, i) => {
            const cardRef = useRef(null);
            const cardInView = useInView(cardRef, { once: true, margin: "-80px" });
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={step.number}
                ref={cardRef}
                initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                animate={cardInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex items-center gap-12 py-12 ${
                  isLeft ? "flex-row" : "flex-row-reverse"
                } ${i > 0 ? "border-t border-[rgba(0,0,0,0.04)]" : ""}`}
              >
                {/* Número grande */}
                <div className="shrink-0 w-[clamp(80px,12vw,140px)] flex flex-col items-center">
                  <span className="text-[clamp(3rem,6vw,5rem)] font-bold text-[rgba(0,0,0,0.04)] leading-none select-none">
                    {step.number}
                  </span>
                </div>

                {/* Línea con punto */}
                <div className="hidden md:flex flex-col items-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#1a1a1a]" />
                  <div className="w-px h-full bg-[rgba(0,0,0,0.08)]" />
                </div>

                {/* Contenido */}
                <div className={`flex-1 ${isLeft ? "text-left" : "text-right"}`}>
                  <h3 className="text-[clamp(1.2rem,2vw,1.5rem)] font-bold text-[#1a1a1a] m-0 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#666] text-[clamp(0.85rem,1.2vw,1rem)] leading-relaxed m-0 max-w-md inline-block">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
