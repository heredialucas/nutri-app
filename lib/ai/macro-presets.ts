export interface MacroPreset {
    id: string;
    label: string;
    description: string;
    // percentage split of calories: [protein%, carbs%, fat%]
    ratio: [number, number, number];
}

export const MACRO_PRESETS: MacroPreset[] = [
    { id: "custom", label: "Personalizado", description: "Definí tus propios gramos", ratio: [0, 0, 0] },
    { id: "balanced", label: "Equilibrado", description: "20% proteína · 45% HC · 35% grasas", ratio: [20, 45, 35] },
    { id: "high-protein", label: "Alto en proteína", description: "30% proteína · 40% HC · 30% grasas", ratio: [30, 40, 30] },
    { id: "low-carb", label: "Bajo en carbohidratos", description: "30% proteína · 25% HC · 45% grasas", ratio: [30, 25, 45] },
    { id: "keto", label: "Keto", description: "20% proteína · 5% HC · 75% grasas", ratio: [20, 5, 75] },
    { id: "high-carb", label: "Alto en carbohidratos", description: "15% proteína · 60% HC · 25% grasas", ratio: [15, 60, 25] },
];

// Convierte un objetivo calórico + una distribución en gramos de macros
export function macrosFromRatio(calories: number, ratio: [number, number, number]) {
    return {
        proteinTarget: Math.round((calories * (ratio[0] / 100)) / 4),
        carbTarget: Math.round((calories * (ratio[1] / 100)) / 4),
        fatTarget: Math.round((calories * (ratio[2] / 100)) / 9),
    };
}

export function macroPresetById(id: string): MacroPreset | undefined {
    return MACRO_PRESETS.find((p) => p.id === id);
}
