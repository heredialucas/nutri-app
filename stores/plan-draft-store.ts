import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedMealPlan, PlanOptions } from "@/lib/ai/meal-plan-generator";

interface PlanDraftState {
    patientId: string | null;
    patientName: string;
    plan: GeneratedMealPlan | null;
    options: PlanOptions | null;
    customPrompt: string;
    lastModified: number;
}

interface PlanDraftActions {
    setPlan: (
        patientId: string,
        patientName: string,
        plan: GeneratedMealPlan,
        options: PlanOptions,
        customPrompt: string
    ) => void;
    updatePlan: (plan: GeneratedMealPlan) => void;
    clearPlan: () => void;
    isStale: () => boolean;
    hasDraftForPatient: (patientId: string) => boolean;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 horas

export const usePlanDraftStore = create<PlanDraftState & PlanDraftActions>()(
    persist(
        (set, get) => ({
            patientId: null,
            patientName: "",
            plan: null,
            options: null,
            customPrompt: "",
            lastModified: 0,

            setPlan: (patientId, patientName, plan, options, customPrompt) => {
                set({
                    patientId,
                    patientName,
                    plan,
                    options,
                    customPrompt,
                    lastModified: Date.now(),
                });
            },

            updatePlan: (plan) => {
                set({ plan, lastModified: Date.now() });
            },

            clearPlan: () => {
                set({
                    patientId: null,
                    patientName: "",
                    plan: null,
                    options: null,
                    customPrompt: "",
                    lastModified: 0,
                });
            },

            isStale: () => {
                const { lastModified } = get();
                if (lastModified === 0) return false;
                return Date.now() - lastModified > STALE_THRESHOLD_MS;
            },

            hasDraftForPatient: (patientId) => {
                const { patientId: storedPatientId, plan } = get();
                return storedPatientId === patientId && plan !== null;
            },
        }),
        {
            name: "plan-draft-storage",
        }
    )
);
