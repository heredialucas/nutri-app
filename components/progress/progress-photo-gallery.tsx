"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteProgressPhoto } from "@/app/actions/progress-photos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Images, Trash2, X } from "lucide-react";
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

interface Photo {
    id: string;
    url: string;
    type: string;
    takenAt: string | null;
    createdAt: string;
}

interface ProgressPhotoGalleryProps {
    photos: Photo[];
}

const typeLabels: Record<string, string> = {
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

export function ProgressPhotoGallery({ photos }: ProgressPhotoGalleryProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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

    if (photos.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No hay fotos de progreso
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Images className="h-4 w-4" />
                        Fotos de progreso
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {Object.entries(grouped).map(([type, typePhotos]) => (
                        <div key={type}>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                {typeLabels[type] || type}
                                <Badge variant="secondary" className="text-xs">
                                    {typePhotos.length}
                                </Badge>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {typePhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="group relative aspect-[3/4] overflow-hidden rounded-lg border cursor-pointer"
                                        onClick={() => setSelectedPhoto(photo)}
                                    >
                                        <img
                                            src={photo.url}
                                            alt={`Foto ${typeLabels[photo.type] || photo.type}`}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs text-white">
                                                {photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.createdAt)}
                                            </p>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Eliminar foto</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. ¿Eliminar esta foto de progreso?
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
                </CardContent>
            </Card>

            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-3xl p-0">
                    {selectedPhoto && (
                        <div className="relative">
                            <img
                                src={selectedPhoto.url}
                                alt={`Foto ${typeLabels[selectedPhoto.type]}`}
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
        </>
    );
}
