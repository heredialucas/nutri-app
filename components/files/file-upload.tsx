"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/use-image-upload";
import { uploadPatientFile } from "@/app/actions/files";
import { useRouter } from "next/navigation";

const CATEGORIES = [
    { value: "analisis", label: "Análisis / Laboratorio" },
    { value: "estudio", label: "Estudio médico" },
    { value: "receta", label: "Receta / Indicación" },
    { value: "informe", label: "Informe" },
    { value: "constancia", label: "Constancia" },
    { value: "otro", label: "Otro" },
];

interface FileUploadProps {
    patientId: string;
}

export function FileUpload({ patientId }: FileUploadProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState("otro");

    const { upload } = useImageUpload({
        preset: "patientDocuments",
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
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
                        toast.success("Archivo subido correctamente");
                        setSelectedFile(null);
                        setCategory("otro");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        router.refresh();
                    } else {
                        toast.error(result.error || "Error al subir el archivo");
                    }
                } catch (error) {
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

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return Image;
        if (type === "application/pdf") return FileText;
        return File;
    };

    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                <div className="space-y-1">
                    <Label>Archivo</Label>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                </div>
                <div className="space-y-1">
                    <Label>Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full sm:w-[200px]">
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
            </div>

            {selectedFile && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {(() => {
                            const Icon = getFileIcon(selectedFile.type);
                            return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />;
                        })()}
                        <span className="text-sm truncate">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                    </div>
                    <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Subiendo...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Subir
                            </>
                        )}
                    </Button>
                </div>
            )}

            {!selectedFile && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo (imagen o PDF, máx. 10 MB)
                </Button>
            )}
        </div>
    );
}
