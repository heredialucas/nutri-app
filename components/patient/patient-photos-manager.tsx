"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { createProgressPhoto, deleteProgressPhoto } from "@/app/actions/progress-photos";
import { toast } from "sonner";
import { Camera, Upload, Trash2, X, Images } from "lucide-react";

interface Photo {
    id: string;
    url: string;
    type: string;
    takenAt: string | null;
    createdAt: string;
}

interface PatientPhotosManagerProps {
    patientId: string;
    photos: Photo[];
}

const PHOTO_TYPES = [
    { value: "frontal", label: "Frontal" },
    { value: "lateral", label: "Lateral" },
    { value: "posterior", label: "Posterior" },
];

const TYPE_LABELS: Record<string, string> = {
    frontal: "Frontal",
    lateral: "Lateral",
    posterior: "Posterior",
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function PatientPhotosManager({ patientId, photos }: PatientPhotosManagerProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [photoType, setPhotoType] = useState("frontal");
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            toast.error("Seleccioná una imagen válida");
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            toast.error("La imagen debe ser menor a 10MB");
            return;
        }
        setFile(f);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "progress_photos");

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );

            if (!res.ok) throw new Error("Error al subir la imagen");
            const data = await res.json();

            await createProgressPhoto({
                patientId,
                url: data.secure_url,
                publicId: data.public_id,
                type: photoType,
                takenAt: new Date().toISOString(),
                consentGranted: true,
            });

            toast.success("Foto subida");
            setFile(null);
            setPreview(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al subir");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            await deleteProgressPhoto(id);
            toast.success("Foto eliminada");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al eliminar");
        } finally {
            setDeleting(null);
        }
    };

    const grouped = photos.reduce<Record<string, Photo[]>>((acc, photo) => {
        if (!acc[photo.type]) acc[photo.type] = [];
        acc[photo.type].push(photo);
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="space-y-1">
                    <label className="text-xs font-medium">Tipo de vista</label>
                    <select
                        value={photoType}
                        onChange={(e) => setPhotoType(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                        {PHOTO_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                {preview ? (
                    <div className="flex items-end gap-3">
                        <div className="relative h-20 w-16 overflow-hidden rounded-lg border">
                            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex gap-1.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => { setFile(null); setPreview(null); }}
                            >
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleUpload} disabled={loading}>
                                {loading ? "..." : <Upload className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                    >
                        <Camera className="mr-1.5 h-3.5 w-3.5" />
                        Subir foto
                    </Button>
                )}
            </div>

            {photos.length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([type, typePhotos]) => (
                        <div key={type}>
                            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                {TYPE_LABELS[type] || type}
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    {typePhotos.length}
                                </Badge>
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {typePhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="group relative aspect-[3/4] overflow-hidden rounded-lg border cursor-pointer"
                                        onClick={() => setSelectedPhoto(photo)}
                                    >
                                        <img
                                            src={photo.url}
                                            alt={`${TYPE_LABELS[photo.type]}`}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[10px] text-white">
                                                {photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.createdAt)}
                                            </p>
                                        </div>
                                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Eliminar foto</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(photo.id)}
                                                            disabled={deleting === photo.id}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            {deleting === photo.id ? "Eliminando..." : "Eliminar"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                    No hay fotos de progreso todavía.
                </p>
            )}

            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-2xl p-0">
                    {selectedPhoto && (
                        <div className="relative">
                            <img
                                src={selectedPhoto.url}
                                alt={`${TYPE_LABELS[selectedPhoto.type]}`}
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => setSelectedPhoto(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
