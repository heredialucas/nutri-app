"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, ExternalLink, FileCheck } from "lucide-react";
import { deleteConsent } from "@/app/actions/consents";

interface Consent {
    id: string;
    type: string;
    version?: string | null;
    signedAt: string;
    signature?: string | null;
    ipAddress?: string | null;
    documentUrl?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
    treatment: "Tratamiento",
    photo: "Fotográfico",
    data: "Protección de datos",
    general: "General",
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

interface ConsentHistoryProps {
    consents: Consent[];
}

export function ConsentHistory({ consents }: ConsentHistoryProps) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            await deleteConsent(deleteId);
            toast.success("Consentimiento eliminado");
            setDeleteId(null);
            router.refresh();
        } catch {
            toast.error("Error al eliminar el consentimiento");
        } finally {
            setLoading(false);
        }
    };

    if (consents.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No hay consentimientos registrados.
            </p>
        );
    }

    return (
        <>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="hidden sm:table-cell">Versión</TableHead>
                            <TableHead className="hidden md:table-cell">Firma</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {consents.map((consent) => (
                            <TableRow key={consent.id}>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {TYPE_LABELS[consent.type] || consent.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                    {consent.version || "—"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                    {consent.signature ? (
                                        <span className="flex items-center gap-1">
                                            <FileCheck className="h-3 w-3 text-green-600" />
                                            Firmado
                                        </span>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(consent.signedAt)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        {consent.documentUrl && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                asChild
                                            >
                                                <a
                                                    href={consent.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeleteId(consent.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar consentimiento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El registro se eliminará permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
