"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Lenis from "lenis";

const ease = [0.76, 0, 0.24, 1] as const;

const navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#como-trabajo", label: "Cómo trabajo" },
  { href: "#muro", label: "Muro" },
  { href: "#reservar", label: "Reservar" },
  { href: "#contacto", label: "Contacto" },
];

export function NavMenu({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
  }, []);

  const curveInitial = `M100 0 L100 ${windowHeight} Q-100 ${windowHeight / 2} 100 0`;
  const curveTarget = `M100 0 L100 ${windowHeight} Q100 ${windowHeight / 2} 100 0`;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setIsOpen(false);
    setTimeout(() => {
      const target = document.querySelector(href);
      if (!target) return;
      const w = window as unknown as { lenis?: Lenis };
      w.lenis?.scrollTo(target as HTMLElement, { offset: -80, duration: 1.4 });
    }, 400);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ x: "calc(100% + 100px)" }}
          animate={{ x: "0%", transition: { duration: 0.8, ease } }}
          exit={{ x: "calc(100% + 100px)", transition: { duration: 0.8, ease } }}
          className="fixed top-0 right-0 z-50 h-svh bg-[#1a1a1a] overflow-y-auto"
          style={{ width: "100vw", maxWidth: "100vw" }}
        >
          <svg
            className="absolute top-0"
            style={{ left: "-99px", width: "100px", height: "100%", fill: "#1a1a1a", stroke: "none" }}
            preserveAspectRatio="none"
          >
            <motion.path
              d={curveInitial}
              animate={{ d: curveTarget }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
            />
          </svg>

          <div className="flex flex-col justify-between h-full box-border px-[clamp(24px,6vw,80px)] py-[clamp(32px,5vw,60px)]">
            <div className="flex flex-col gap-[clamp(16px,3vw,24px)] mt-5">
              <div className="flex justify-between items-center pb-5 mb-4 border-b border-[#ffffff1a]">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#ffffff59] font-normal">
                  Navegación
                </span>
              </div>
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  custom={i}
                  initial={{ x: "80px" }}
                  animate={{
                    x: "0px",
                    transition: { duration: 0.8, ease, delay: 0.05 * i },
                  }}
                  exit={{
                    x: "80px",
                    transition: { duration: 0.8, ease, delay: 0.05 * i },
                  }}
                  className="flex items-baseline gap-4 py-1"
                >
                  <span className="text-[#ffffff40] text-xs tabular-nums min-w-[20px] font-normal">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-[#ffffffb3] font-light no-underline transition-all duration-350 relative hover:text-white hover:translate-x-2 text-[clamp(1.5rem,4vw,2.5rem)] cursor-pointer"
                  >
                    {link.label}
                    <span className="absolute bottom-[-2px] left-0 w-0 h-[1px] bg-white transition-all duration-400 hover:w-full" />
                  </a>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/reservar"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-full bg-white text-[#1a1a1a] no-underline transition-all duration-300 hover:bg-white/90"
              >
                Reservar turno
              </Link>

              <button
                onClick={() => setIsOpen(false)}
                className="self-end cursor-pointer bg-[#ffffff0f] border border-[#ffffff1a] rounded-full flex items-center justify-center w-12 h-12 transition-all duration-300 hover:bg-[#ffffff1a]"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M1 1L17 17M17 1L1 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
