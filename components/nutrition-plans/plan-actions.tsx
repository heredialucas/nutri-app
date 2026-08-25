"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    MoreVertical,
    Pencil,
    Copy,
    CheckCircle,
    Archive,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
    updateNutritionPlan,
    duplicateNutritionPlan,
    setActivePlan,
    deleteNutritionPlan,
} from "@/app/actions/nutrition-plans";

interface PlanActionsProps {
    planId: string;
    planStatus: string;
    patientId: string;
}

export function PlanActions({ planId, planStatus, patientId }: PlanActionsProps) {
    const router = useRouter();
    const [showDelete, setShowDelete] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        setLoading(true);
        try {
            await setActivePlan(planId, patientId);
            toast.success("Plan publicado");
            router.refresh();
        } catch (error) {
            toast.error("Error al publicar");
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = async () => {
        setLoading(true);
        try {
            const newPlan = await duplicateNutritionPlan(planId);
            toast.success("Plan duplicado");
            router.push(`/dashboard/planes/${newPlan.id}/edit`);
        } catch (error) {
            toast.error("Error al duplicar");
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        setLoading(true);
        try {
            await updateNutritionPlan(planId, { status: "ARCHIVED" });
            toast.success("Plan archivado");
            router.refresh();
        } catch (error) {
            toast.error("Error al archivar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteNutritionPlan(planId);
            toast.success("Plan eliminado");
            router.push("/dashboard/planes");
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setLoading(false);
            setShowDelete(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={loading}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {planStatus === "DRAFT" && (
                        <DropdownMenuItem onClick={handlePublish}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publicar plan
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDuplicate}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar plan
                    </DropdownMenuItem>
                    {planStatus === "ACTIVE" && (
                        <DropdownMenuItem onClick={handleArchive}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/planes/${planId}/edit`)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowDelete(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el plan y toda su estructura de días, comidas y alimentos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
