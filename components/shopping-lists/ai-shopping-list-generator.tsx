"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Zap, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { generateShoppingListWithAI } from "@/app/actions/ai-shopping-lists";
import type { GeneratedShoppingList } from "@/lib/ai/shopping-list-generator";

const SUGGESTIONS = [
    "Compras semanales para dieta mediterránea",
    "Alimentos para preparar lunches saludables de la semana",
    "Ingredientes para desayunos saludables durante un mes",
    "Lista para preparar snacks proteicos para la semana",
    "Compra mensual de verduras y frutas de estación",
    "Alimentos para dieta baja en sodio",
    "Ingredientes para preparar comidas light para la semana",
    "Lista para alimentación vegana completa",
];

interface AIShoppingListGeneratorProps {
    onGenerated: (list: GeneratedShoppingList) => void;
}

export function AIShoppingListGenerator({ onGenerated }: AIShoppingListGeneratorProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (customPrompt?: string) => {
        const finalPrompt = customPrompt || prompt;
        if (!finalPrompt.trim()) {
            toast.error("Escribí qué lista necesitás");
            return;
        }

        setLoading(true);
        try {
            const list = await generateShoppingListWithAI(finalPrompt);
            onGenerated(list);
            toast.success("Lista generada correctamente");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al generar la lista";
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
                    placeholder="Describí la lista de compras que necesitás..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
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
                        className="cursor-pointer select-none transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
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
