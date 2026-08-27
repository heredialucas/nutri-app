"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Zap, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { generateRecipeWithAI } from "@/app/actions/ai-recipes";
import type { GeneratedRecipe } from "@/lib/ai/recipe-generator";

const SUGGESTIONS = [
    "Ensalada completa con pollo y aguacate",
    "Smoothie verde detox con espinaca y jengibre",
    "Pasta integral con salsa de tomate casera",
    "Tostadas integrales con hummus y vegetales",
    "Sopa de verduras reconfortante",
    "Bowl de quinoa con vegetales asados",
    "Omelette de claras con espinaca y hongos",
    "Pescado al horno con limón y hierbas",
];

interface AIRecipeGeneratorProps {
    onGenerated: (recipe: GeneratedRecipe) => void;
    patientId?: string;
}

export function AIRecipeGenerator({ onGenerated, patientId }: AIRecipeGeneratorProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (customPrompt?: string) => {
        const finalPrompt = customPrompt || prompt;
        if (!finalPrompt.trim()) {
            toast.error("Escribí qué receta necesitás");
            return;
        }

        setLoading(true);
        try {
            const recipe = await generateRecipeWithAI(finalPrompt, patientId);
            onGenerated(recipe);
            toast.success("Receta generada correctamente");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al generar la receta";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        handleGenerate(suggestion);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Textarea
                    placeholder="Describí la receta que necesitás..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!loading && prompt.trim()) handleGenerate();
                        }
                    }}
                    rows={3}
                    className="resize-none pr-12"
                    disabled={loading}
                />
                <Button
                    size="icon"
                    className="absolute right-2 bottom-2 size-8"
                    onClick={() => handleGenerate()}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Sparkles className="size-4" />
                    )}
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion, i) => (
                    <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer select-none transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                        onClick={() => !loading && handleSuggestionClick(suggestion)}
                    >
                        <Zap className="mr-1 size-3" />
                        {suggestion}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
