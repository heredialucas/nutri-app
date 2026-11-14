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

export const STANDARD_MEALS = [
  { id: "Desayuno", label: "Desayuno", calorieShare: 0.20 },
  { id: "Media mañana", label: "Media mañana", calorieShare: 0.10 },
  { id: "Almuerzo", label: "Almuerzo", calorieShare: 0.35 },
  { id: "Merienda", label: "Merienda", calorieShare: 0.10 },
  { id: "Cena", label: "Cena", calorieShare: 0.25 },
  { id: "Colación", label: "Colación", calorieShare: 0.10 },
] as const;

export const MEAL_PROTOCOLS = [
  {
    id: "standard-4",
    label: "Tradicional (4 comidas)",
    meals: ["Desayuno", "Almuerzo", "Merienda", "Cena"],
    fasting: "",
  },
  {
    id: "standard-5",
    label: "Completo (5 comidas)",
    meals: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena"],
    fasting: "",
  },
  {
    id: "if-no-breakfast",
    label: "Ayuno 16:8 (Sin desayuno)",
    meals: ["Almuerzo", "Merienda", "Cena"],
    fasting: "Ayuno intermitente 16:8 (sin desayuno)",
  },
  {
    id: "if-no-dinner",
    label: "Ayuno 16:8 (Sin cena)",
    meals: ["Desayuno", "Media mañana", "Almuerzo", "Merienda"],
    fasting: "Ayuno intermitente 16:8 (sin cena)",
  },
] as const;

export type MealCalorieMode = "redistribute" | "discount";

/**
 * Calcula las calorías ajustadas cuando se omiten comidas principales (ej. desayuno o cena).
 * En modo "discount", resta la proporción calórica de las comidas estándar omitidas respecto al esquema base de 4 comidas.
 */
export function adjustCaloriesForSelectedMeals(
  baseCalories: number,
  selectedMeals: string[],
  mode: MealCalorieMode
): { adjustedCalories: number; discountFactor: number; omittedCalories: number } {
  if (!baseCalories || baseCalories <= 0 || mode === "redistribute") {
    return { adjustedCalories: baseCalories, discountFactor: 1, omittedCalories: 0 };
  }

  const normalized = new Set(selectedMeals.map((m) => m.trim().toLowerCase()));
  const omittedCoreShare = STANDARD_MEALS
    .filter((m) => ["Desayuno", "Almuerzo", "Merienda", "Cena"].includes(m.id))
    .filter((m) => !normalized.has(m.label.toLowerCase()))
    .reduce((acc, m) => acc + m.calorieShare, 0);

  const discountFactor = Math.max(0.35, 1 - omittedCoreShare);
  const adjustedCalories = Math.round((baseCalories * discountFactor) / 10) * 10;
  return {
    adjustedCalories,
    discountFactor,
    omittedCalories: Math.max(0, baseCalories - adjustedCalories),
  };
}

export interface RecalculatableFood {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export interface RecalculatableMeal<F extends RecalculatableFood = RecalculatableFood> {
  label: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  foods: F[];
}

export interface RecalculatableDay<M extends RecalculatableMeal = RecalculatableMeal> {
  meals: M[];
}

/**
 * Recalcula calorías y macronutrientes de cada comida a partir de sus alimentos
 * y el promedio diario del plan.
 */
export function recalculateDaysTotals<D extends RecalculatableDay>(days: D[]): {
  days: D[];
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
} {
  const nextDays = days.map((day) => ({
    ...day,
    meals: day.meals.map((meal) => {
      const hasAnyFoodMacro = meal.foods.some(
        (f) => f.calories != null || f.protein != null || f.carbs != null || f.fat != null
      );
      if (!hasAnyFoodMacro) {
        return meal.foods.length === 0
          ? { ...meal, calories: 0, protein: 0, carbs: 0, fat: 0 }
          : meal;
      }
      const calories = Math.round(meal.foods.reduce((s, f) => s + (Number(f.calories) || 0), 0));
      const protein = Math.round(meal.foods.reduce((s, f) => s + (Number(f.protein) || 0), 0) * 10) / 10;
      const carbs = Math.round(meal.foods.reduce((s, f) => s + (Number(f.carbs) || 0), 0) * 10) / 10;
      const fat = Math.round(meal.foods.reduce((s, f) => s + (Number(f.fat) || 0), 0) * 10) / 10;
      return { ...meal, calories, protein, carbs, fat };
    }),
  }));

  const count = Math.max(1, nextDays.length);
  const dailyCalories = Math.round(
    nextDays.reduce((sum, d) => sum + d.meals.reduce((s, m) => s + (Number(m.calories) || 0), 0), 0) / count
  );
  const dailyProtein = Math.round(
    (nextDays.reduce((sum, d) => sum + d.meals.reduce((s, m) => s + (Number(m.protein) || 0), 0), 0) / count) * 10
  ) / 10;
  const dailyCarbs = Math.round(
    (nextDays.reduce((sum, d) => sum + d.meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0), 0) / count) * 10
  ) / 10;
  const dailyFat = Math.round(
    (nextDays.reduce((sum, d) => sum + d.meals.reduce((s, m) => s + (Number(m.fat) || 0), 0), 0) / count) * 10
  ) / 10;

  return { days: nextDays as D[], dailyCalories, dailyProtein, dailyCarbs, dailyFat };
}
