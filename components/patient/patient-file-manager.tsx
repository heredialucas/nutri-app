"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/use-image-upload";
import { uploadPatientFile, deletePatientFile } from "@/app/actions/files";
import { FilePreview } from "@/components/files/file-preview";
import { Upload, Loader2, FileText, Image, File, Trash2, Eye, FolderOpen } from "lucide-react";

const CATEGORIES = [
    { value: "analisis", label: "Análisis / Laboratorio" },
    { value: "estudio", label: "Estudio médico" },
    { value: "receta", label: "Receta / Indicación" },
    { value: "informe", label: "Informe" },
    { value: "constancia", label: "Constancia" },
    { value: "otro", label: "Otro" },
];

const CATEGORY_LABELS: Record<string, string> = {
    analisis: "Análisis",
    estudio: "Estudio",
    receta: "Receta",
    informe: "Informe",
    constancia: "Constancia",
    otro: "Otro",
};

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

interface PatientFileManagerProps {
    patientId: string;
    files: PatientFile[];
}

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

export function PatientFileManager({ patientId, files }: PatientFileManagerProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState("otro");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<PatientFile | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { upload } = useImageUpload({ preset: "patientDocuments" });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error("El archivo no puede superar 10 MB");
            return;
        }
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64 = reader.result as string;
                    const result = await upload(base64);
                    if (result.success && result.url && result.publicId) {
                        await uploadPatientFile({
                            patientId,
                            name: selectedFile.name,
                            url: result.url,
                            publicId: result.publicId,
                            mimeType: selectedFile.type,
                            size: selectedFile.size,
                            category,
                        });
                        toast.success("Archivo subido");
                        setSelectedFile(null);
                        setCategory("otro");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        setOpen(false);
                        router.refresh();
                    } else {
                        toast.error(result.error || "Error al subir");
                    }
                } catch {
                    toast.error("Error al subir el archivo");
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(selectedFile);
        } catch {
            toast.error("Error al leer el archivo");
            setIsUploading(false);
        }
    };

    const handleOpenChange = (val: boolean) => {
        setOpen(val);
        if (!val) {
            setSelectedFile(null);
            setCategory("otro");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deletePatientFile(deleteId);
            toast.success("Archivo eliminado");
            setDeleteId(null);
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    Documentos
                </h4>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            Subir archivo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Subir archivo</DialogTitle>
                            <DialogDescription>Imagen o PDF, máx. 10 MB.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Categoría</Label>
                                <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                                className="hidden"
                            />
                            {selectedFile ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {(() => {
                                                const Icon = getFileIcon(selectedFile.type);
                                                return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />;
                                            })()}
                                            <span className="text-sm truncate">{selectedFile.name}</span>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                ({(selectedFile.size / 1024).toFixed(0)} KB)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-1.5">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                                    Subiendo...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-1.5 h-4 w-4" />
                                                    Subir
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-4 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/40"
                                >
                                    <FolderOpen className="h-4 w-4" />
                                    Seleccionar archivo (imagen o PDF, máx. 10 MB)
                                </button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {files.length > 0 ? (
                <div className="space-y-1.5">
                    {files.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                            >
                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <button
                                        onClick={() => setPreviewFile(file)}
                                        className="text-sm font-medium hover:text-primary transition-colors truncate block text-left w-full"
                                    >
                                        {file.name}
                                    </button>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                            {CATEGORY_LABELS[file.category || "otro"] || "Otro"}
                                        </Badge>
                                        <span>{formatFileSize(file.size)}</span>
                                        <span>·</span>
                                        <span>{formatDate(file.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setPreviewFile(file)}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleteId(file.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                    No hay archivos subidos todavía.
                </p>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar archivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Eliminando..." : "Eliminar"}
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
        </div>
    );
}