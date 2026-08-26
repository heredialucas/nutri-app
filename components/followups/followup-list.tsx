"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ClipboardList } from "lucide-react";
import { deleteFollowUp } from "@/app/actions/followups";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FollowUpForm } from "./followup-form";

interface FollowUpListProps {
    followUps: any[];
    patientId: string;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function adherenceColor(adherence: string | null) {
    if (!adherence) return "secondary";
    const val = parseInt(adherence);
    if (val >= 80) return "default";
    if (val >= 50) return "secondary";
    return "destructive";
}

export function FollowUpList({ followUps, patientId }: FollowUpListProps) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este seguimiento?")) return;
        try {
            await deleteFollowUp(id);
            toast.success("Seguimiento eliminado");
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (followUps.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No hay seguimientos registrados para este paciente</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {followUps.map((fu) => (
                <div key={fu.id}>
                    {editingId === fu.id ? (
                        <FollowUpForm
                            patientId={patientId}
                            followUp={fu}
                            onSuccess={() => setEditingId(null)}
                        />
                    ) : (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        Semana del {formatDate(fu.weekStart)}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingId(fu.id)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(fu.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Peso</p>
                                        <p className="font-medium">{fu.weight ? `${fu.weight} kg` : "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Cumplimiento</p>
                                        <Badge variant={adherenceColor(fu.adherence) as any}>
                                            {fu.adherence ? `${fu.adherence}%` : "—"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Hambre</p>
                                        <p className="font-medium">{fu.hunger ? `${fu.hunger}/10` : "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Energía</p>
                                        <p className="font-medium">{fu.energy ? `${fu.energy}/10` : "—"}</p>
                                    </div>
                                </div>
                                {fu.difficulties && (
                                    <div className="mt-3 text-sm">
                                        <p className="text-muted-foreground">Dificultades</p>
                                        <p>{fu.difficulties}</p>
                                    </div>
                                )}
                                {fu.patientNotes && (
                                    <div className="mt-3 text-sm">
                                        <p className="text-muted-foreground">Notas del paciente</p>
                                        <p>{fu.patientNotes}</p>
                                    </div>
                                )}
                                {fu.proNotes && (
                                    <div className="mt-3 text-sm">
                                        <p className="text-muted-foreground">Notas del profesional</p>
                                        <p className="italic">{fu.proNotes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            ))}
        </div>
    );
}
