// ─────────────────────────────────────────────────────────────
// Motor de cálculo antropométrico ISAK (composición corporal)
// Basado en el modelo de 5 componentes de Ross & Kerr y los
// modelos de predicción de Lee et al. (2000) y Harris & Benedict.
//
// Fórmulas validadas contra el informe ISAKMetry de referencia.
// ─────────────────────────────────────────────────────────────

export type Gender = "MALE" | "FEMALE" | null | undefined;

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH";

export const ACTIVITY_LEVELS: {
  value: ActivityLevel;
  label: string;
  pal: number; // Physical Activity Level (factor)
}[] = [
  { value: "SEDENTARY", label: "Sedentario (mínima o sin actividad)", pal: 1.2 },
  { value: "LIGHT", label: "Entre 1 y 3 veces por semana", pal: 1.375 },
  { value: "MODERATE", label: "Entre 3 y 5 veces por semana", pal: 1.55 },
  { value: "HIGH", label: "Entre 6 y 7 veces por semana", pal: 1.725 },
  { value: "VERY_HIGH", label: "Actividad muy intensa / 2 veces al día", pal: 1.9 },
];

export const MEASUREMENT_SITES = {
  triceps: "Tríceps",
  subscapular: "Subescapular",
  suprailiac: "Supraespinal",
  abdominal: "Abdominal",
  thigh: "Muslo",
  calf: "Pierna",
} as const;

// Entradas de una evaluación ISAK
export interface IsakInputs {
  weight: number; // kg
  height: number; // cm
  age?: number; // años
  gender: Gender;
  activityLevel?: ActivityLevel | null;
  // pliegues (cm; en el form se capturan mm y se convierten a cm internamente)
  tricepsSF?: number | null;
  subscapSF?: number | null;
  suprailiacSF?: number | null;
  abdominalSF?: number | null;
  thighSF?: number | null;
  calfSF?: number | null;
  // perímetros (cm)
  relaxedArm?: number | null;
  flexedArm?: number | null;
  waist?: number | null;
  hip?: number | null;
  midThigh?: number | null;
  calf?: number | null;
  // Diámetros ISAK (mm)
  humerusBreadth?: number | null;
  femurBreadth?: number | null;
  biStyloidWrist?: number | null;
}

export interface ReferenceRange {
  rangoSaludable: string;
  interpretacion: string;
}

export interface HealthIndex {
  nombre: string;
  valor: number;
  unidad: string;
  rangoSaludable: string;
  interpretacion: string;
}

export interface IsakResult {
  datos: {
    peso: number;
    talla: number;
    edad: number;
    genero: string;
    imc: number;
    imcClasificacion: string;
  };
  sumatorio6Pliegues: number | null;
  fraccionamiento: {
    masaAdiposaKg: number | null;
    masaMuscularKg: number | null;
    masaOseaKg: number | null;
    otrosTejidosKg: number | null;
    masaAdiposaPct: number | null;
    masaMuscularPct: number | null;
    masaOseaPct: number | null;
    otrosPct: number | null;
  };
  bicompartimental: {
    masaGrasaKg: number | null;
    masaGrasaPct: number | null;
    masaLibreGrasaKg: number | null;
  };
  zonas: {
    adiposo: {
      superiorPct: number | null;
      centralPct: number | null;
      inferiorPct: number | null;
      predominante: string | null;
    };
    muscular: {
      brazoPct: number | null;
      musloPct: number | null;
      piernaPct: number | null;
      predominante: string | null;
    };
  };
  distribucion: {
    brazoCorregido: number | null;
    musloCorregido: number | null;
    piernaCorregida: number | null;
  };
  adiposidad: { sumatorio: number | null; porPliegue: { nombre: string; valor: number }[] };
  mediciones: {
    perimetros: { nombre: string; valor: number | null }[];
  };
  muscularidad: {
    brazoCorregido: number | null;
    musloCorregido: number | null;
    piernaCorregida: number | null;
  };
  indiceAdiposoMuscular: { valor: number | null; clasificacion: string; interpretacion: string };
  indiceMusculoOseo: { valor: number | null; clasificacion: string; interpretacion: string };
  gastoEnergetico: {
    metodo: string;
    nivelActividad: string;
    pal: number | null;
    metabolismoBasal: number | null;
    gastoTotal: number | null;
    interpretacion: string;
  };
  salud: HealthIndex[];
  rendimiento: {
    diferenciaBrazo: number | null;
    areaSuperficie: number | null;
    indicePerdidaCalor: number | null;
  };
  diametros: {
    humerusBreadth: number | null;
    femurBreadth: number | null;
    biStyloidWrist: number | null;
  };
}

// ── Utilidades ────────────────────────────────────────────────
const PI = Math.PI;
const round = (n: number, d = 2) => {
  if (!Number.isFinite(n)) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};

/**
 * Convierte un pliegue capturado en milímetros a centímetros.
 * La API acepta pliegues en cm (consistentes con perímetros en cm).
 */
export const sfMmToCm = (mm: number) => mm / 10;

// ── Edad a partir de la fecha de nacimiento ──
export function calcularEdad(birthDate: Date | string | null | undefined, ref = new Date()): number | null {
  if (!birthDate) return null;
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(birth.getTime())) return null;
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

// ── Perímetros corregidos (restando el pliegue cutáneo: C - π*pliegue) ──
export function corregirPerimetro(perimetroCm: number, pliegueCm: number): number {
  if (!Number.isFinite(perimetroCm) || !Number.isFinite(pliegueCm)) return NaN;
  return perimetroCm - PI * pliegueCm;
}

// ── Sumatorio de 6 pliegues ──
// Internamente los pliegues se manejan en cm (para los perímetros corregidos),
// pero el sumatorio y la fórmula de Kerr usan milímetros (estándar ISAK).
export function sumatorio6Pliegues(i: IsakInputs): number | null {
  const folds = [i.tricepsSF, i.subscapSF, i.suprailiacSF, i.abdominalSF, i.thighSF, i.calfSF];
  const valid = folds.filter((f): f is number => f != null);
  if (valid.length !== 6) return null;
  const sumCm = valid.reduce((a, b) => a + b, 0);
  return sumCm * 10; // mm
}

// ── Masa adiposa (Kerr / Ross, 1991) — modelo Phantom de 5 componentes ──
// Z_ADIP = [Σ6SF(mm) × (170.18/H) − 116.41] / 34.79
// M_ADIP = [(Z_ADIP × 5.85) + 25.6] / (170.18/H)³
export function masaAdiposa(i: IsakInputs): number | null {
  const s6mm = sumatorio6Pliegues(i);
  if (s6mm == null || !i.height) return null;
  const H = i.height; // cm
  const ratio = 170.18 / H;
  const zAdip = (s6mm * ratio - 116.41) / 34.79;
  const mAdip = ((zAdip * 5.85) + 25.6) / Math.pow(ratio, 3);
  return mAdip >= 0 ? mAdip : null;
}

// ── Masa muscular esquelética (Lee et al., 2000) ──
// SM = Ht(m) × [0.00744×CAG² + 0.00088×CTG² + 0.00441×CCG²]
//      + 2.4×sexo − 0.048×edad + raza + 7.8
export function masamuscular(i: IsakInputs): number | null {
  const { height, age, gender, relaxedArm, tricepsSF, midThigh, thighSF, calf, calfSF } = i;
  if (!height || age == null) return null;
  const cag = relaxedArm != null && tricepsSF != null ? corregirPerimetro(relaxedArm, tricepsSF) : null;
  const ctg = midThigh != null && thighSF != null ? corregirPerimetro(midThigh, thighSF) : null;
  const ccg = calf != null && calfSF != null ? corregirPerimetro(calf, calfSF) : null;
  if (cag == null || ctg == null || ccg == null) return null;

  const Hm = height / 100;
  const sex = gender === "MALE" ? 1 : 0;
  const race = 0; // blanco/hispano
  const sm =
    Hm * (0.00744 * Math.pow(cag, 2) + 0.00088 * Math.pow(ctg, 2) + 0.00441 * Math.pow(ccg, 2)) +
    2.4 * sex -
    0.048 * age +
    race +
    7.8;
  return sm >= 0 ? sm : null;
}

// ── IMC e interpretación (OMS) ──
export function imc(weight: number, heightCm: number): number {
  const h = heightCm / 100;
  if (!Number.isFinite(weight) || !Number.isFinite(h) || weight <= 0 || h <= 0) return NaN;
  return weight / (h * h);
}
export function clasificarImc(v: number): string {
  if (v < 18.5) return "Bajo peso";
  if (v < 25) return "Normopeso";
  if (v < 30) return "Sobrepeso";
  if (v < 35) return "Obesidad I";
  if (v < 40) return "Obesidad II";
  return "Obesidad III";
}

// ── Área de superficie corporal (Du Bois & Du Bois, 1916) ──
export function areaSuperficie(w: number, hCm: number): number {
  return 0.007184 * Math.pow(w, 0.425) * Math.pow(hCm, 0.725);
}

// ── Índice de conicidad ──
export function indiceConicidad(waistCm: number, w: number, hCm: number): number {
  return waistCm / 100 / (0.109 * Math.sqrt(w / (hCm / 100)));
}

// ── Metabolismo basal (Harris & Benedict, 1919) ──
export function harrisBenedict(gender: Gender, w: number, hCm: number, age: number): number {
  if (gender === "MALE") {
    return 66.473 + 13.7516 * w + 5.0033 * hCm - 6.755 * age;
  }
  return 655.0955 + 9.5634 * w + 1.8496 * hCm - 4.6756 * age;
}

// ── Índice adiposo muscular: kg de masa adiposa por cada kg de masa muscular ──
export function clasificarIam(v: number): { clasificacion: string; interpretacion: string } {
  let clasificacion: string;
  if (v < 0.35) clasificacion = "Muy bueno";
  else if (v <= 0.45) clasificacion = "Bueno";
  else if (v <= 0.55) clasificacion = "Aceptable";
  else clasificacion = "Alto";
  return {
    clasificacion,
    interpretacion:
      "Expresa cuántos kg de masa adiposa tiene que transportar cada kg de masa muscular. Cuando menor sea este valor, más eficiente será en el desplazamiento.",
  };
}

// ── Masa ósea (Rocha / Von Döbeln, 1975) ──
export function masaOsea(heightCm: number, wristMm?: number | null, femurMm?: number | null): number | null {
  if (!heightCm || !wristMm || !femurMm || wristMm <= 0 || femurMm <= 0) return null;
  const hM = heightCm / 100;
  const wM = wristMm / 1000;
  const fM = femurMm / 1000;
  const val = 3.02 * Math.pow(hM * hM * wM * fM * 400, 0.712);
  return Number.isFinite(val) && val > 0 ? val : null;
}

// ── Índice músculo / óseo ──
export function clasificarImo(v: number): { clasificacion: string; interpretacion: string } {
  let clasificacion: string;
  if (v < 2.01) clasificacion = "Muy bajo";
  else if (v < 2.11) clasificacion = "Bajo";
  else if (v <= 2.78) clasificacion = "Promedio";
  else if (v <= 2.96) clasificacion = "Alto";
  else clasificacion = "Muy alto";
  return {
    clasificacion,
    interpretacion: "Expresa los kg de tejido muscular en función de la estructura ósea.",
  };
}

// ── Masa grasa bicompartimental (Yuhasz 6 pliegues) ──
export function masaGrasaYuhaszPct(s6mm: number | null, gender: Gender): number | null {
  if (s6mm == null || s6mm <= 0) return null;
  const pct = gender === "FEMALE" ? s6mm * 0.1548 + 3.58 : s6mm * 0.1051 + 2.585;
  return Number.isFinite(pct) && pct > 0 && pct < 75 ? pct : null;
}

// ── Interpretaciones de salud ──
function saludRiesgoCintura(waistCm: number, gender: Gender): HealthIndex {
  const threshold = gender === "FEMALE" ? 80 : 94;
  const interpretacion = waistCm < threshold ? "Riesgo cardiometabólico bajo" : "Riesgo cardiometabólico elevado";
  return {
    nombre: "Perímetro cintura",
    valor: round(waistCm) ?? 0,
    unidad: "cm",
    rangoSaludable: "H: <94 · M: <80",
    interpretacion,
  };
}
function saludCinturaCadera(whr: number, gender: Gender): HealthIndex {
  return {
    nombre: "Índice cintura cadera",
    valor: round(whr) ?? 0,
    unidad: "",
    rangoSaludable: "H: <0.90 · M: <0.85",
    interpretacion: whr < (gender === "FEMALE" ? 0.85 : 0.9) ? "Riesgo cardiometabólico bajo" : "Riesgo cardiometabólico elevado",
  };
}
function saludConicidad(c: number): HealthIndex {
  return {
    nombre: "Índice de conicidad",
    valor: round(c) ?? 0,
    unidad: "",
    rangoSaludable: "1 - 1,4",
    interpretacion:
      c <= 1.0
        ? "Distribución grasa más saludable (menor acumulación central)"
        : "Cuanto más lejos de la unidad, más grasa acumulada a nivel central",
  };
}
function saludPliegueAbdominal(pliegueCm: number): HealthIndex {
  const mm = pliegueCm * 10;
  return {
    nombre: "Pliegue abdominal",
    valor: round(mm) ?? 0,
    unidad: "mm",
    rangoSaludable: "≤ 15",
    interpretacion: mm <= 15 ? "Óptimo ≤ 15" : "Por encima del valor óptimo",
  };
}
function saludPliegueTriceps(pliegueCm: number): HealthIndex {
  const mm = pliegueCm * 10;
  return {
    nombre: "Pliegue tríceps",
    valor: round(mm) ?? 0,
    unidad: "mm",
    rangoSaludable: "< 15",
    interpretacion: mm < 15 ? "Óptimo < 15" : "Por encima del valor óptimo",
  };
}

// ── Cálculo principal ────────────────────────────────────────
export function computeIsak(inputs: IsakInputs): IsakResult {
  const isFemale = inputs.gender === "FEMALE";
  const generoLabel = inputs.gender === "MALE" ? "Masculino" : inputs.gender === "FEMALE" ? "Femenino" : "No especificado";

  // Masa corporal y talla
  const peso = inputs.weight;
  const talla = inputs.height;

  // Índice de masa corporal
  const bmi = imc(peso, talla);
  const bmiClass = Number.isFinite(bmi) ? clasificarImc(bmi) : "No disponible";

  // Sumatorio de pliegues
  const s6 = sumatorio6Pliegues(inputs);

  // Fraccionamiento tisular (5 componentes)
  const masaAdiposaKg = masaAdiposa(inputs);
  const masaMuscularKg = masamuscular(inputs);
  const masaOseaKg = masaOsea(talla, inputs.biStyloidWrist, inputs.femurBreadth);
  let otrosTejidosKg: number | null = null;
  if (masaAdiposaKg != null && masaMuscularKg != null) {
    otrosTejidosKg = peso - masaAdiposaKg - masaMuscularKg;
  }

  // Bicompartimental (Yuhasz)
  const masaGrasaPct = masaGrasaYuhaszPct(s6, inputs.gender);
  const masaGrasaKg = masaGrasaPct != null && peso > 0 ? (peso * masaGrasaPct) / 100 : null;
  const masaLibreGrasaKg = masaGrasaKg != null && peso > 0 ? Math.max(0, peso - masaGrasaKg) : null;

  // Distribución adiposo-muscular (perímetros corregidos)
  const brazoCorregido =
    inputs.relaxedArm != null && inputs.tricepsSF != null
      ? corregirPerimetro(inputs.relaxedArm, inputs.tricepsSF)
      : null;
  const musloCorregido =
    inputs.midThigh != null && inputs.thighSF != null
      ? corregirPerimetro(inputs.midThigh, inputs.thighSF)
      : null;
  const piernaCorregida =
    inputs.calf != null && inputs.calfSF != null ? corregirPerimetro(inputs.calf, inputs.calfSF) : null;

  // Distribución por zonas
  let adiposoZonas: IsakResult["zonas"]["adiposo"] = {
    superiorPct: null,
    centralPct: null,
    inferiorPct: null,
    predominante: null,
  };
  if (
    inputs.tricepsSF != null &&
    inputs.subscapSF != null &&
    inputs.suprailiacSF != null &&
    inputs.abdominalSF != null &&
    inputs.thighSF != null &&
    inputs.calfSF != null
  ) {
    const sup = inputs.tricepsSF + inputs.subscapSF;
    const cen = inputs.suprailiacSF + inputs.abdominalSF;
    const inf = inputs.thighSF + inputs.calfSF;
    const tot = sup + cen + inf;
    if (tot > 0) {
      const superiorPct = round((sup / tot) * 100, 2);
      const centralPct = round((cen / tot) * 100, 2);
      const inferiorPct = round((inf / tot) * 100, 2);
      const maxZone = [
        { name: "Superior", val: superiorPct ?? 0 },
        { name: "Central", val: centralPct ?? 0 },
        { name: "Inferior", val: inferiorPct ?? 0 },
      ].sort((a, b) => b.val - a.val)[0];
      adiposoZonas = { superiorPct, centralPct, inferiorPct, predominante: maxZone.name };
    }
  }

  let muscularZonas: IsakResult["zonas"]["muscular"] = {
    brazoPct: null,
    musloPct: null,
    piernaPct: null,
    predominante: null,
  };
  if (brazoCorregido != null && musloCorregido != null && piernaCorregida != null) {
    const totMusc = brazoCorregido + musloCorregido + piernaCorregida;
    if (totMusc > 0) {
      const brazoPct = round((brazoCorregido / totMusc) * 100, 2);
      const musloPct = round((musloCorregido / totMusc) * 100, 2);
      const piernaPct = round((piernaCorregida / totMusc) * 100, 2);
      const maxMusc = [
        { name: "Brazo", val: brazoPct ?? 0 },
        { name: "Muslo", val: musloPct ?? 0 },
        { name: "Pierna", val: piernaPct ?? 0 },
      ].sort((a, b) => b.val - a.val)[0];
      muscularZonas = { brazoPct, musloPct, piernaPct, predominante: maxMusc.name };
    }
  }

  // Pliegues individuales (mostrados en mm)
  const porPliegue = [
    { nombre: MEASUREMENT_SITES.triceps, valor: Math.round((inputs.tricepsSF ?? 0) * 10) },
    { nombre: MEASUREMENT_SITES.subscapular, valor: Math.round((inputs.subscapSF ?? 0) * 10) },
    { nombre: MEASUREMENT_SITES.suprailiac, valor: Math.round((inputs.suprailiacSF ?? 0) * 10) },
    { nombre: MEASUREMENT_SITES.abdominal, valor: Math.round((inputs.abdominalSF ?? 0) * 10) },
    { nombre: MEASUREMENT_SITES.thigh, valor: Math.round((inputs.thighSF ?? 0) * 10) },
    { nombre: MEASUREMENT_SITES.calf, valor: Math.round((inputs.calfSF ?? 0) * 10) },
  ];

  // Índice adiposo muscular
  let iam: { valor: number | null; clasificacion: string; interpretacion: string } = {
    valor: null,
    clasificacion: "-",
    interpretacion: "",
  };
  if (masaAdiposaKg != null && masaMuscularKg != null && masaMuscularKg > 0) {
    const v = masaAdiposaKg / masaMuscularKg;
    const c = clasificarIam(v);
    iam = { valor: round(v), ...c };
  }

  // Índice músculo / óseo
  let imo: { valor: number | null; clasificacion: string; interpretacion: string } = {
    valor: null,
    clasificacion: "-",
    interpretacion: "Expresa los kg de tejido muscular en función de la estructura ósea.",
  };
  if (masaMuscularKg != null && masaOseaKg != null && masaOseaKg > 0) {
    const v = masaMuscularKg / masaOseaKg;
    const c = clasificarImo(v);
    imo = { valor: round(v), ...c };
  }

  // Gasto energético
  const palEntry = ACTIVITY_LEVELS.find((a) => a.value === inputs.activityLevel) ?? null;
  let mb: number | null = null;
  let get: number | null = null;
  let gastoInterpretacion = "No se pudo estimar el gasto energético.";
  if (inputs.gender && inputs.age != null) {
    mb = harrisBenedict(inputs.gender, peso, talla, inputs.age);
    if (palEntry) {
      get = mb * palEntry.pal;
      gastoInterpretacion = palEntry.label;
    }
  }

  // Índices de salud
  const salud: HealthIndex[] = [];
  if (inputs.waist != null && Number.isFinite(inputs.waist)) salud.push(saludRiesgoCintura(inputs.waist, inputs.gender));
  if (inputs.waist != null && inputs.hip != null && inputs.hip > 0) {
    salud.push(saludCinturaCadera(inputs.waist / inputs.hip, inputs.gender));
  }
  if (inputs.waist != null && peso > 0 && talla > 0) salud.push(saludConicidad(indiceConicidad(inputs.waist, peso, talla)));
  if (inputs.abdominalSF != null) salud.push(saludPliegueAbdominal(inputs.abdominalSF));
  if (Number.isFinite(bmi)) salud.push({
    nombre: "IMC", valor: round(bmi) ?? 0, unidad: "kg/m²", rangoSaludable: "18,5 - 24,9", interpretacion: bmiClass,
  });
  if (inputs.tricepsSF != null) salud.push(saludPliegueTriceps(inputs.tricepsSF));

  // Índices de rendimiento
  const diferenciaBrazo =
    inputs.flexedArm != null && inputs.relaxedArm != null ? inputs.flexedArm - inputs.relaxedArm : null;
  const as = peso > 0 && talla > 0 ? areaSuperficie(peso, talla) : NaN;
  // IPC (índice de pérdida de calor): superficie corporal (cm²) por kg de masa.
  // Expresa la relación superficie/masa: a mayor valor, mayor capacidad de disipar calor.
  const ipc = as ? (as * 10000) / peso : null;

  return {
    datos: {
      peso: round(peso) ?? 0,
      talla: round(talla) ?? 0,
      edad: inputs.age ?? 0,
      genero: generoLabel,
      imc: round(bmi) ?? 0,
      imcClasificacion: bmiClass,
    },
    sumatorio6Pliegues: s6 != null ? round(s6) : null,
    fraccionamiento: {
      masaAdiposaKg: masaAdiposaKg != null ? round(masaAdiposaKg) : null,
      masaMuscularKg: masaMuscularKg != null ? round(masaMuscularKg) : null,
      masaOseaKg: masaOseaKg != null ? round(masaOseaKg) : null,
      otrosTejidosKg: otrosTejidosKg != null ? round(otrosTejidosKg) : null,
      masaAdiposaPct: masaAdiposaKg != null ? round((masaAdiposaKg / peso) * 100, 1) : null,
      masaMuscularPct: masaMuscularKg != null ? round((masaMuscularKg / peso) * 100, 1) : null,
      masaOseaPct: masaOseaKg != null && peso > 0 ? round((masaOseaKg / peso) * 100, 1) : null,
      otrosPct: otrosTejidosKg != null ? round((otrosTejidosKg / peso) * 100, 1) : null,
    },
    bicompartimental: {
      masaGrasaKg: masaGrasaKg != null ? round(masaGrasaKg) : null,
      masaGrasaPct: masaGrasaPct != null ? round(masaGrasaPct, 1) : null,
      masaLibreGrasaKg: masaLibreGrasaKg != null ? round(masaLibreGrasaKg) : null,
    },
    zonas: {
      adiposo: adiposoZonas,
      muscular: muscularZonas,
    },
    distribucion: {
      brazoCorregido: brazoCorregido != null ? round(brazoCorregido) : null,
      musloCorregido: musloCorregido != null ? round(musloCorregido) : null,
      piernaCorregida: piernaCorregida != null ? round(piernaCorregida) : null,
    },
    adiposidad: {
      sumatorio: s6 != null ? round(s6) : null,
      porPliegue,
    },
    mediciones: {
      perimetros: [
        { nombre: "Brazo relajado", valor: round(inputs.relaxedArm ?? NaN) },
        { nombre: "Brazo flexionado y contraído", valor: round(inputs.flexedArm ?? NaN) },
        { nombre: "Cintura", valor: round(inputs.waist ?? NaN) },
        { nombre: "Cadera", valor: round(inputs.hip ?? NaN) },
        { nombre: "Muslo medio", valor: round(inputs.midThigh ?? NaN) },
        { nombre: "Pierna", valor: round(inputs.calf ?? NaN) },
      ],
    },
    muscularidad: {
      brazoCorregido: brazoCorregido != null ? round(brazoCorregido) : null,
      musloCorregido: musloCorregido != null ? round(musloCorregido) : null,
      piernaCorregida: piernaCorregida != null ? round(piernaCorregida) : null,
    },
    indiceAdiposoMuscular: iam,
    indiceMusculoOseo: imo,
    gastoEnergetico: {
      metodo: "Harris & Benedict (1919)",
      nivelActividad: palEntry?.label ?? inputs.activityLevel ?? "No especificado",
      pal: palEntry?.pal ?? null,
      metabolismoBasal: mb != null ? round(mb) : null,
      gastoTotal: get != null ? round(get) : null,
      interpretacion: gastoInterpretacion,
    },
    salud,
    rendimiento: {
      diferenciaBrazo: diferenciaBrazo != null ? round(diferenciaBrazo) : null,
      areaSuperficie: as != null ? round(as) : null,
      indicePerdidaCalor: ipc != null ? round(ipc) : null,
    },
    diametros: {
      humerusBreadth: round(inputs.humerusBreadth ?? NaN), femurBreadth: round(inputs.femurBreadth ?? NaN),
      biStyloidWrist: round(inputs.biStyloidWrist ?? NaN),
    },
  };
}

// Convierte los campos Decimal de Prisma de una evaluación a entradas numéricas.
// Los pliegues se guardan en mm en BD y el motor los usa en cm (perímetros corregidos).
export function inputsFromMeasurement(m: {
  weight?: unknown;
  height?: unknown;
  age?: number;
  gender?: string | null;
  activityLevel?: string | null;
  tricepsSF?: unknown;
  subscapSF?: unknown;
  suprailiacSF?: unknown;
  abdominalSF?: unknown;
  thighSF?: unknown;
  calfSF?: unknown;
  relaxedArm?: unknown;
  flexedArm?: unknown;
  waist?: unknown;
  hip?: unknown;
  midThigh?: unknown;
   calf?: unknown;
   humerusBreadth?: unknown;
   femurBreadth?: unknown;
   biStyloidWrist?: unknown;
   birthDate?: Date | string | null;
   measuredAt?: Date | string | null;
}): IsakInputs {
  const num = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const sfInCm = (v: unknown): number | undefined => {
    const n = num(v);
    return n != null ? n / 10 : undefined;
  };
  return {
    weight: num(m.weight) ?? 0,
    height: num(m.height) ?? 0,
   age: m.age ?? calcularEdad(m.birthDate, m.measuredAt ? new Date(m.measuredAt) : new Date()) ?? 0,
    gender: (m.gender as Gender) || null,
    activityLevel: (m.activityLevel as ActivityLevel) || null,
    tricepsSF: sfInCm(m.tricepsSF),
    subscapSF: sfInCm(m.subscapSF),
    suprailiacSF: sfInCm(m.suprailiacSF),
    abdominalSF: sfInCm(m.abdominalSF),
    thighSF: sfInCm(m.thighSF),
    calfSF: sfInCm(m.calfSF),
    relaxedArm: num(m.relaxedArm),
    flexedArm: num(m.flexedArm),
    waist: num(m.waist),
    hip: num(m.hip),
    midThigh: num(m.midThigh),
    calf: num(m.calf),
    humerusBreadth: num(m.humerusBreadth), femurBreadth: num(m.femurBreadth),
     biStyloidWrist: num(m.biStyloidWrist),
  };
}
