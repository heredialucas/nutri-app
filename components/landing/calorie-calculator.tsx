"use client";

import { useMemo, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  Calculator,
  Flame,
  Dumbbell,
  Wheat,
  Droplets,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { activityLevels, calculateCalorieTargets, goals } from "@/lib/calorie-calculator";

const fieldBase =
  "w-full rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] px-4 py-3 text-white text-sm font-normal outline-none transition-all duration-300 placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.5)] focus:bg-[rgba(255,255,255,0.09)]";

const formatNumber = (n: number) => n.toLocaleString("es-AR");

export function CalorieCalculator() {
  const [sex, setSex] = useState<"masculino" | "femenino">("masculino");
  const [age, setAge] = useState("30");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");
  const [activity, setActivity] = useState("moderado");
  const [objective, setObjective] = useState("mantener");

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const result = useMemo(() => {
    const calculation = calculateCalorieTargets({ sex, age: parseFloat(age) || 0, weight: parseFloat(weight) || 0, height: parseFloat(height) || 0, activity, objective });
    if (!calculation) return null;

    return {
      calories: calculation.calories,
      bmr: calculation.bmr,
      goalLabel: calculation.goalLabel,
      activityLabel: calculation.activityLabel,
      macros: [
        {
          label: "Proteínas",
          icon: Dumbbell,
          min: calculation.proteinMin,
          max: calculation.proteinMax,
          note: "1.6–2.2 g / kg de peso",
          valueClass: "text-emerald-400",
          dotClass: "bg-emerald-400",
        },
        {
          label: "Carbohidratos",
          icon: Wheat,
          min: calculation.carbsMin,
          max: calculation.carbsMax,
          note: "Energía para el día a día",
          valueClass: "text-amber-400",
          dotClass: "bg-amber-400",
        },
        {
          label: "Grasas",
          icon: Droplets,
          min: calculation.fatMin,
          max: calculation.fatMax,
          note: "25–35% de las calorías",
          valueClass: "text-sky-400",
          dotClass: "bg-sky-400",
        },
      ],
    };
  }, [sex, age, weight, height, activity, objective]);

  const inputLabel =
    "block uppercase tracking-[0.25em] text-[rgba(255,255,255,0.4)] text-[10px] font-medium mb-2";

  return (
    <section id="calculadora" className="relative bg-[#0c0c0e] overflow-hidden">
      {/* Brillo sutil de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 10%, rgba(16,185,129,0.06), transparent 70%), radial-gradient(500px 400px at 90% 90%, rgba(16,185,129,0.05), transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-[clamp(20px,5vw,80px)] py-[clamp(48px,6vh,80px)] lg:min-h-svh lg:flex lg:flex-col lg:justify-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-3 py-1">
              <Calculator size={12} className="text-emerald-400" strokeWidth={2} />
              <span className="uppercase tracking-[0.3em] text-emerald-400 text-[10px] font-semibold">
                100% gratis
              </span>
            </div>
          </div>
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold text-white leading-tight m-0">
              Calculá tus calorías y macros en segundos
            </h2>
            <p className="mt-4 lg:mt-0 lg:max-w-sm text-[rgba(255,255,255,0.5)] text-[clamp(0.9rem,1.2vw,1rem)] font-light leading-relaxed m-0">
              Ingresá tus datos y conocé cuántas calorías y proteínas, carbohidratos
              y grasas necesitás por día según tu objetivo. Sin costo y sin registro.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            {/* Sexo */}
            <div>
              <label className={inputLabel}>Sexo</label>
              <div className="grid grid-cols-2 gap-3">
                {(["masculino", "femenino"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium text-center capitalize transition-all duration-300 ${
                      sex === s
                        ? "bg-white text-[#0c0c0e] border-white"
                        : "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.4)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Edad, peso y altura */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={inputLabel}>Edad</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  className={fieldBase}
                />
              </div>
              <div>
                <label className={inputLabel}>Peso (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className={fieldBase}
                />
              </div>
              <div>
                <label className={inputLabel}>Altura (cm)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  className={fieldBase}
                />
              </div>
            </div>

            {/* Actividad */}
            <div>
              <label className={inputLabel}>Nivel de actividad</label>
              <div className="relative">
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className={`${fieldBase} appearance-none pr-10 cursor-pointer`}
                >
                  {activityLevels.map((a) => (
                    <option key={a.value} value={a.value} className="text-[#0c0c0e]">
                      {a.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] pointer-events-none"
                />
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className={inputLabel}>Objetivo</label>
              <div className="relative">
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className={`${fieldBase} appearance-none pr-10 cursor-pointer`}
                >
                  {goals.map((g) => (
                    <option key={g.value} value={g.value} className="text-[#0c0c0e]">
                      {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] pointer-events-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Resultado */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[clamp(24px,3vw,40px)]"
          >
            {result ? (
              <div className="flex flex-col gap-8">
                {/* Kcal */}
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <Flame size={26} className="text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <div className="text-right flex-1">
                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-[clamp(3rem,6vw,4.5rem)] font-bold text-white leading-none tracking-tight">
                        {formatNumber(result.calories)}
                      </span>
                      <span className="text-[rgba(255,255,255,0.5)] text-sm font-light">
                        kcal / día
                      </span>
                    </div>
                    <p className="mt-2 text-[rgba(255,255,255,0.4)] text-xs font-light m-0">
                      Basal (BMR) ≈ {formatNumber(result.bmr)} kcal · Objetivo:{" "}
                      {result.goalLabel}
                    </p>
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.macros.map((m) => (
                    <div
                      key={m.label}
                      className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dotClass}`} />
                        <span className="text-[rgba(255,255,255,0.5)] text-[10px] uppercase tracking-[0.2em] font-medium">
                          {m.label}
                        </span>
                      </div>
                      <p className={`text-lg font-bold m-0 ${m.valueClass}`}>
                        {m.min}–{m.max} g
                      </p>
                      <p className="text-[rgba(255,255,255,0.3)] text-[11px] font-light m-0 leading-snug">
                        {m.note}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA de conversión */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                  <p className="text-[rgba(255,255,255,0.7)] text-sm font-light m-0">
                    ¿Querés un plan 100% personalizado sobre tu resultado?
                  </p>
                  <Link
                    href="/reservar"
                    className="inline-flex items-center justify-center gap-3 bg-white text-[#0c0c0e] uppercase tracking-[0.1em] cursor-pointer rounded-[50px] px-8 py-4 text-sm font-semibold transition-all duration-300 hover:bg-white/85 no-underline"
                  >
                    <span>Reservar mi plan</span>
                    <ArrowRight size={16} strokeWidth={2} />
                  </Link>
                  <p className="text-[rgba(255,255,255,0.3)] text-xs font-light m-0">
                    Resultados orientativos según fórmulas estandarizadas. No
                    reemplazan una evaluación profesional.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                <Calculator size={40} strokeWidth={1} className="text-[rgba(255,255,255,0.2)]" />
                <p className="text-[rgba(255,255,255,0.5)] text-sm font-light m-0 max-w-[240px] leading-relaxed">
                  Completá tus datos para calcular tus calorías y macros
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
