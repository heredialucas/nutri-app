"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2, FileText } from "lucide-react";
import { deleteIsak } from "@/app/actions/isak";
import { toast } from "sonner";
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

interface Assessment {
  id: string;
  measuredAt: string;
  weight: string | null;
  height: string | null;
  measuredBy: { id: string; fullName: string | null } | null;
}

interface IsakHistoryProps {
  assessments: Assessment[];
  patientId: string;
  currentId: string;
}

export function IsakHistory({ assessments, patientId, currentId }: IsakHistoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    router.push(`${pathname}?eval=${id}`);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteIsak(id, patientId);
      toast.success("Evaluación eliminada");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Historial de evaluaciones ({assessments.length})
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => {
          const active = a.id === currentId;
          const fecha = format(new Date(a.measuredAt), "dd/MM/yyyy", { locale: es });
          return (
            <div
              key={a.id}
              className={`flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelect(a.id)}
                className="flex items-center gap-2 text-left flex-1 min-w-0"
              >
                <FileText className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{fecha}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.weight ? `${a.weight} kg` : "—"} · {a.height ? `${a.height} cm` : "—"}
                  </p>
                </div>
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar evaluación</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. ¿Eliminar la evaluación del {fecha}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(a.id)}
                      disabled={deleting === a.id}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting === a.id ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
