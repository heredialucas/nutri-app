"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Stethoscope, Monitor, UserPlus, RotateCcw } from "lucide-react";

const services = [
  {
    icon: Stethoscope,
    title: "Primera consulta",
    description: "Evaluación completa de tu estado nutricional, antecedentes y objetivos. Diseñamos juntos tu plan de acción.",
  },
  {
    icon: RotateCcw,
    title: "Seguimiento",
    description: "Controles periódicos para evaluar progreso, ajustar el plan y acompañarte en cada etapa del camino.",
  },
  {
    icon: Monitor,
    title: "Consulta online",
    description: "Atención por videollamada con la misma calidad y cercanía. Ideal para pacientes de otras localidades.",
  },
  {
    icon: UserPlus,
    title: "Consulta presencial",
    description: "En el consultorio, con mediciones antropométricas y atención cara a cara para quienes lo prefieran.",
  },
];

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col gap-5 p-8 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.1)]"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#f5f5f0] text-[#1a1a1a] transition-colors duration-300 group-hover:bg-[#1a1a1a] group-hover:text-white">
        <service.icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#1a1a1a] m-0 mb-2">{service.title}</h3>
        <p className="text-sm text-[#666] leading-relaxed m-0">{service.description}</p>
      </div>
    </motion.div>
  );
}

export function LandingServices() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="servicios" className="py-[clamp(60px,10vh,120px)] px-[clamp(20px,5vw,80px)] bg-[#fafaf8]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="uppercase tracking-[0.3em] text-[#999] text-xs font-medium mb-4 m-0">
            Servicios
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#1a1a1a] leading-tight m-0 max-w-lg">
            Cada consulta, un paso hacia tu bienestar
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
