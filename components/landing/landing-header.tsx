"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { NavMenu } from "./landing-menu";
import Lenis from "lenis";

const navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#como-trabajo", label: "Cómo trabajo" },
  { href: "#muro", label: "Muro" },
  { href: "#reservar", label: "Reservar" },
  { href: "#contacto", label: "Contacto" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;
    const w = window as unknown as { lenis?: Lenis };
    w.lenis?.scrollTo(target as HTMLElement, { offset: -80, duration: 1.4 });
  }, []);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -100 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -100 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed left-0 right-0 z-50 flex items-center justify-between will-change-transform transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "text-[#1a1a1a] backdrop-blur-xl bg-[rgba(235,237,239,0.96)] border border-[rgba(0,0,0,0.04)] rounded-full h-[clamp(46px,4.5vw,52px)] px-[clamp(16px,2vw,28px)] top-[14px] left-[clamp(16px,5vw,100px)] right-[clamp(16px,5vw,100px)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_14px_rgba(0,0,0,0.05),0_12px_36px_rgba(0,0,0,0.04)]"
            : "text-white border border-transparent h-[clamp(50px,5.5vw,60px)] px-[clamp(16px,4vw,40px)] top-0"
        }`}
      >
        <Link href="/" className="flex items-baseline gap-1 text-lg font-semibold no-underline">
          <span className={scrolled ? "text-[#2c2c2c]" : "text-white"}>
            Mauro
          </span>
          <span className={scrolled ? "text-[rgba(0,0,0,0.32)]" : "text-white/60"}>
            Acosta
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all duration-300 rounded-full cursor-pointer ${
                  scrolled
                    ? "text-[rgba(0,0,0,0.5)] hover:text-[#1a1a1a]"
                    : "text-[rgba(255,255,255,0.5)] hover:text-white"
                }`}
              >
                <span className={`text-[10px] tabular-nums ${scrolled ? "text-[rgba(0,0,0,0.3)]" : "text-white/30"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={scrolled ? "text-[rgba(0,0,0,0.6)]" : "text-white/60"}>
                  {link.label}
                </span>
              </a>
            ))}
          </nav>

          <Link
            href="/auth/login"
            className={`hidden md:inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
              scrolled
                ? "text-white bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                : "text-[#0c0c0e] bg-white hover:bg-white/90"
            }`}
          >
            Iniciar sesión
          </Link>

          <Link
            href="/reservar"
            className={`hidden md:inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-full border transition-all duration-300 ${
              scrolled
                ? "text-[#1a1a1a] border-[#1a1a1a33] hover:border-[#1a1a1a]"
                : "text-white border-[#ffffff4d] hover:border-white"
            }`}
          >
            Reservar
          </Link>

          <button
            onClick={() => setMenuOpen(true)}
            className="relative cursor-pointer flex items-center justify-center w-10 h-10"
            aria-label="Menú"
          >
            <div className="flex flex-col gap-[5px] items-end">
              <span className={`block h-[1.5px] transition-all duration-300 ${scrolled ? "bg-[#1a1a1a]" : "bg-white"}`} style={{ width: "20px" }} />
              <span className={`block h-[1.5px] transition-all duration-300 ${scrolled ? "bg-[#1a1a1a]" : "bg-white"}`} style={{ width: "14px" }} />
              <span className={`block h-[1.5px] transition-all duration-300 ${scrolled ? "bg-[#1a1a1a]" : "bg-white"}`} style={{ width: "17px" }} />
            </div>
          </button>
        </div>
      </motion.header>

      <NavMenu isOpen={menuOpen} setIsOpen={setMenuOpen} />
    </>
  );
}
