"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteMeasurement } from "@/app/actions/measurements";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Measurement {
    id: string;
    weight: string | null;
    height: string | null;
    bmi: string | null;
    waist: string | null;
    hip: string | null;
    arm: string | null;
    bodyFatPercentage: string | null;
    muscleMass: string | null;
    notes: string | null;
    measuredAt: string;
    measuredBy: { id: string; fullName: string | null } | null;
}

interface MeasurementHistoryProps {
    measurements: Measurement[];
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatValue(value: string | null, suffix: string = "") {
    if (!value) return "—";
    return `${value}${suffix}`;
}

export function MeasurementHistory({ measurements }: MeasurementHistoryProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            await deleteMeasurement(id);
            toast.success("Medición eliminada");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al eliminar");
        } finally {
            setDeleting(null);
        }
    };

    if (measurements.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No hay mediciones registradas
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Peso</TableHead>
                        <TableHead className="text-right">Altura</TableHead>
                        <TableHead className="text-right">IMC</TableHead>
                        <TableHead className="text-right">Cintura</TableHead>
                        <TableHead className="text-right">Cadera</TableHead>
                        <TableHead className="text-right">Brazo</TableHead>
                        <TableHead className="text-right">Grasa</TableHead>
                        <TableHead className="text-right">Masa</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {measurements.map((m) => (
                        <TableRow key={m.id}>
                            <TableCell className="font-medium">
                                {formatDate(m.measuredAt)}
                            </TableCell>
                            <TableCell className="text-right">{formatValue(m.weight, " kg")}</TableCell>
                            <TableCell className="text-right">{formatValue(m.height, " cm")}</TableCell>
                            <TableCell className="text-right">{formatValue(m.bmi)}</TableCell>
                            <TableCell className="text-right">{formatValue(m.waist, " cm")}</TableCell>
                            <TableCell className="text-right">{formatValue(m.hip, " cm")}</TableCell>
                            <TableCell className="text-right">{formatValue(m.arm, " cm")}</TableCell>
                            <TableCell className="text-right">{formatValue(m.bodyFatPercentage, "%")}</TableCell>
                            <TableCell className="text-right">{formatValue(m.muscleMass, " kg")}</TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Eliminar medición</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. ¿Eliminar la medición del {formatDate(m.measuredAt)}?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(m.id)}
                                                disabled={deleting === m.id}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                {deleting === m.id ? "Eliminando..." : "Eliminar"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
