"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carolina M.",
    text: "Después de años probando dietas, Mauro me ayudó a encontrar un equilibrio real. No es una dieta más, es un cambio de vida. Bajé 12 kilos en 6 meses sin pasar hambre.",
    result: "-12 kg en 6 meses",
    stars: 5,
  },
  {
    name: "Roberto L.",
    text: "Empecé porque mi médico me lo recomendó. Hoy puedo decir que fue la mejor decisión. Me enseñó a comer mejor, no a no comer. Cada control me motivaba a seguir.",
    result: "Mejoró sus hábitos en 3 meses",
    stars: 5,
  },
  {
    name: "María P.",
    text: "La consulta online es excelente. Vivo en otra provincia y pude tener el mismo acompañamiento que si fuera presencial. Siempre atenta y con seguimiento personalizado.",
    result: "Paciente online desde 2024",
    stars: 5,
  },
  {
    name: "Juan C.",
    text: "Lo que más me gustó es que no me dijo lo que no podía comer. Me explicó por qué y cómo hacerlo mejor. Eso cambia todo. Ahuedo con energía y sin culpa.",
    result: "Ganó masa muscular y perdió grasa",
    stars: 5,
  },
  {
    name: "Luciana A.",
    text: "Después del embarazo necesitaba ayuda profesional. Mauro armó un plan adaptado a mi ritmo de mamá primeriza. Hoy me siento mejor que antes del embarazo.",
    result: "Recuperación posparto exitosa",
    stars: 5,
  },
  {
    name: "Diego R.",
    text: "Soy deportista y necesitaba una alimentación que acompañe mi entrenamiento. Mauro entendió mis tiempos y diseñó un plan que se adapta a mis horarios de competencia.",
    result: "Rendimiento deportivo mejorado",
    stars: 5,
  },
];

export function LandingWall() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="muro" className="py-[clamp(60px,10vh,120px)] px-[clamp(20px,5vw,80px)] bg-[#fafaf8]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <p className="uppercase tracking-[0.3em] text-[#999] text-xs font-medium mb-4 m-0">
            Muro
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#1a1a1a] leading-tight m-0">
            Lo que dicen mis pacientes
          </h2>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:balance]">
          {testimonials.map((testimonial, i) => {
            const cardRef = useRef(null);
            const cardInView = useInView(cardRef, { once: true, margin: "-40px" });

            return (
              <motion.div
                key={testimonial.name}
                ref={cardRef}
                initial={{ opacity: 0, y: 30 }}
                animate={cardInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="break-inside-avoid mb-5"
              >
                <div className="flex flex-col gap-4 p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  {/* Estrellas */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.stars }).map((_, j) => (
                      <Star key={j} size={14} fill="#eab308" className="text-[#eab308]" />
                    ))}
                  </div>

                  {/* Testimonio */}
                  <p className="text-[#444] text-sm leading-relaxed m-0">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>

                  {/* Resultado */}
                  <div className="inline-flex items-center self-start px-3 py-1 rounded-full bg-[#f0fdf4] text-[#16a34a] text-xs font-medium">
                    {testimonial.result}
                  </div>

                  {/* Autor */}
                  <div className="flex items-center gap-3 pt-2 border-t border-[rgba(0,0,0,0.04)]">
                    <div className="w-8 h-8 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#1a1a1a] text-xs font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      {testimonial.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
