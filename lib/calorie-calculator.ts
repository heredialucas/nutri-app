export const activityLevels = [
  { value: "sedentario", label: "Sedentario", factor: 1.2 },
  { value: "ligero", label: "Ligero", factor: 1.375 },
  { value: "moderado", label: "Moderado", factor: 1.55 },
  { value: "activo", label: "Activo", factor: 1.725 },
  { value: "muy_activo", label: "Muy activo", factor: 1.9 },
] as const;

export const goals = [
  { value: "perder", label: "Perder grasa", factor: 0.85 },
  { value: "mantener", label: "Mantener peso", factor: 1 },
  { value: "ganar", label: "Ganar masa muscular", factor: 1.15 },
] as const;

export interface CalorieCalculatorInput {
  sex: "masculino" | "femenino";
  age: number;
  weight: number;
  height: number;
  activity: string;
  objective: string;
}

export interface CalorieCalculatorResult {
  calories: number;
  bmr: number;
  goalLabel: string;
  activityLabel: string;
  proteinMin: number;
  proteinMax: number;
  fatMin: number;
  fatMax: number;
  carbsMin: number;
  carbsMax: number;
}

export function calculateCalorieTargets(input: CalorieCalculatorInput): CalorieCalculatorResult | null {
  if (!input.weight || !input.height || !input.age || input.weight <= 0 || input.height <= 0 || input.age <= 0) return null;

  const bmr = input.sex === "femenino"
    ? 10 * input.weight + 6.25 * input.height - 5 * input.age - 161
    : 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;
  const activity = activityLevels.find((item) => item.value === input.activity) ?? activityLevels[2];
  const goal = goals.find((item) => item.value === input.objective) ?? goals[1];
  const calories = Math.round(bmr * activity.factor * goal.factor);
  const proteinMin = Math.round(1.6 * input.weight);
  const proteinMax = Math.round(2.2 * input.weight);
  const fatMin = Math.round((calories * 0.25) / 9);
  const fatMax = Math.round((calories * 0.35) / 9);
  const carbsMin = Math.max(0, Math.round((calories - proteinMax * 4 - fatMax * 9) / 4));
  const carbsMax = Math.max(0, Math.round((calories - proteinMin * 4 - fatMin * 9) / 4));

  return { calories, bmr: Math.round(bmr), goalLabel: goal.label, activityLabel: activity.label, proteinMin, proteinMax, fatMin, fatMax, carbsMin, carbsMax };
}
