"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Plus, Loader2 } from "lucide-react";
import {
    createShoppingList,
    generateShoppingListFromPlan,
} from "@/app/actions/shopping-lists";
import { getNutritionPlans } from "@/app/actions/nutrition-plans";
import { ShoppingListComponent } from "@/components/shopping-lists/shopping-list";

interface ShoppingListData {
    id: string;
    title: string;
    patientId: string | null;
    nutritionPlanId: string | null;
    createdAt: string;
    items: {
        id: string;
        name: string;
        quantity: string | null;
        unit: string | null;
        isChecked: boolean;
    }[];
}

interface Plan {
    id: string;
    title: string;
    patient: { firstName: string; lastName: string };
}

export function ShoppingListsClient({ initialLists }: { initialLists: ShoppingListData[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [manualTitle, setManualTitle] = useState("");
    const [mode, setMode] = useState<"manual" | "from-plan">("manual");
    const [loading, setLoading] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);

    async function loadPlans() {
        if (plans.length > 0) return;
        setLoadingPlans(true);
        try {
            const result = await getNutritionPlans();
            setPlans(result as any[]);
        } catch {
            toast.error("Error al cargar planes");
        } finally {
            setLoadingPlans(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "from-plan" && selectedPlanId) {
                await generateShoppingListFromPlan(selectedPlanId);
                toast.success("Lista generada desde el plan");
            } else {
                if (!manualTitle.trim()) {
                    toast.error("El título es obligatorio");
                    setLoading(false);
                    return;
                }
                await createShoppingList({ title: manualTitle.trim() });
                toast.success("Lista creada");
            }
            setOpen(false);
            setSelectedPlanId("");
            setManualTitle("");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Error al crear la lista");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <Dialog
                open={open}
                onOpenChange={(v) => {
                    setOpen(v);
                    if (v) loadPlans();
                }}
            >
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva lista
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear lista de compras</DialogTitle>
                        <DialogDescription>
                            Creá una lista manual o generá una desde un plan alimentario existente.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={mode === "manual" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMode("manual")}
                            >
                                Manual
                            </Button>
                            <Button
                                type="button"
                                variant={mode === "from-plan" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMode("from-plan")}
                            >
                                Desde plan
                            </Button>
                        </div>

                        {mode === "manual" ? (
                            <div className="space-y-2">
                                <Label>Título *</Label>
                                <Input
                                    placeholder="Ej: Compras semanales"
                                    value={manualTitle}
                                    onChange={(e) => setManualTitle(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Plan alimentario *</Label>
                                {loadingPlans ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Cargando planes...
                                    </div>
                                ) : plans.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No hay planes creados. Creá uno primero.
                                    </p>
                                ) : (
                                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.title} — {plan.patient.firstName} {plan.patient.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || (mode === "from-plan" ? !selectedPlanId : !manualTitle.trim())}
                            >
                                {loading ? "Creando..." : "Crear lista"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {initialLists.length === 0 ? (
                <div className="text-center py-12">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay listas de compras</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Creá una lista manual o generá una desde un plan alimentario
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {initialLists.map((list) => (
                        <ShoppingListComponent key={list.id} list={list} />
                    ))}
                </div>
            )}
        </div>
    );
}
