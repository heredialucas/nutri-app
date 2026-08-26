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
import { Trash2, Eye, FileText, Image, File } from "lucide-react";
import { deletePatientFile } from "@/app/actions/files";
import { FilePreview } from "./file-preview";

interface PatientFile {
    id: string;
    name: string;
    url: string;
    publicId?: string | null;
    mimeType?: string | null;
    size?: number | null;
    category?: string | null;
    createdAt: string;
    uploadedBy?: { firstName: string; lastName: string } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    analisis: "Análisis",
    estudio: "Estudio",
    receta: "Receta",
    informe: "Informe",
    constancia: "Constancia",
    otro: "Otro",
};

function formatFileSize(bytes: number | null | undefined) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getFileIcon(mimeType: string | null | undefined) {
    if (mimeType?.startsWith("image/")) return Image;
    if (mimeType === "application/pdf") return FileText;
    return File;
}

interface FileListProps {
    files: PatientFile[];
}

export function FileList({ files }: FileListProps) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<PatientFile | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            await deletePatientFile(deleteId);
            toast.success("Archivo eliminado");
            setDeleteId(null);
            router.refresh();
        } catch {
            toast.error("Error al eliminar el archivo");
        } finally {
            setLoading(false);
        }
    };

    if (files.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No hay archivos subidos todavía.
            </p>
        );
    }

    return (
        <>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                            <TableHead className="hidden md:table-cell">Tamaño</TableHead>
                            <TableHead className="hidden md:table-cell">Subido por</TableHead>
                            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <TableRow key={file.id}>
                                    <TableCell>
                                        <button
                                            onClick={() => setPreviewFile(file)}
                                            className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                                        >
                                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                        </button>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant="secondary" className="text-xs">
                                            {CATEGORY_LABELS[file.category || "otro"] || file.category || "Otro"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {file.uploadedBy
                                            ? `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}`
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                        {formatDate(file.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPreviewFile(file)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteId(file.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar archivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
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

            {previewFile && (
                <FilePreview
                    open={!!previewFile}
                    onOpenChange={() => setPreviewFile(null)}
                    fileName={previewFile.name}
                    fileUrl={previewFile.url}
                    mimeType={previewFile.mimeType}
                />
            )}
        </>
    );
}
