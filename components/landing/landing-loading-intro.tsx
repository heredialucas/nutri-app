"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingLoadingIntro() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.style.overflow = "clip";

    const duration = 800;
    const startTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        rafId = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setIsLoading(false), 100);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const exitDuration = 200 + 800;
    const timer = setTimeout(() => {
      document.documentElement.style.overflow = "";
    }, exitDuration);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          exit={{ y: "-100vh" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-[#141516] overflow-hidden"
        >
          <svg className="absolute inset-0 w-full h-[calc(100%+300px)] top-0" preserveAspectRatio="none" viewBox="0 0 100 100">
            <motion.path
              d="M0 0 L100 0 L100 100 Q50 140 0 100 L0 0"
              animate={{ d: "M0 0 L100 0 L100 100 Q50 100 0 100 L0 0" }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              fill="#141516"
            />
          </svg>

          <div className="relative z-10 flex flex-col items-center gap-8">
            <h1 className="text-white text-[clamp(2rem,8vw,5rem)] font-bold tracking-[0.05em] m-0 leading-none">
              Mauro
              <span className="block text-[clamp(1rem,3vw,2rem)] font-light tracking-[0.25em] text-white/40 mt-3">
                Acosta
              </span>
            </h1>

            <div className="w-[clamp(160px,25vw,360px)] h-[2px] bg-[#ffffff15] overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-white/80 rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
