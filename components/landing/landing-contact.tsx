"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export function LandingContact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contacto" className="py-[clamp(60px,10vh,120px)] px-[clamp(20px,5vw,80px)] bg-[#0c0c0e]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="uppercase tracking-[0.3em] text-[rgba(255,255,255,0.35)] text-xs font-medium mb-4 m-0">
            Contacto
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-white leading-tight m-0 max-w-lg">
            ¿Tenés dudas? Escribime
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.06)]">
          {[
            {
              icon: Phone,
              label: "WhatsApp",
              value: "+54 9 3816 70-9189",
              href: "https://wa.me/5493816709189",
            },
            {
              icon: Mail,
              label: "Email",
              value: "consultas@mauroacosta.com",
              href: "mailto:consultas@mauroacosta.com",
            },
            {
              icon: MapPin,
              label: "Consultorio",
              value: "San Miguel de Tucumán, Tucumán",
              href: null,
            },
          ].map((item, i) => {
            const cardRef = useRef(null);
            const cardInView = useInView(cardRef, { once: true, margin: "-60px" });

            return (
              <motion.div
                key={item.label}
                ref={cardRef}
                initial={{ opacity: 0, y: 20 }}
                animate={cardInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4 p-8 bg-[#0c0c0e]"
              >
                <item.icon size={20} strokeWidth={1.5} className="text-[rgba(255,255,255,0.3)]" />
                <div>
                  <p className="text-[rgba(255,255,255,0.4)] text-xs uppercase tracking-[0.15em] m-0 mb-1">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-white text-sm font-medium no-underline transition-opacity hover:opacity-80"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-white text-sm font-medium m-0">{item.value}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
