"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProgressPhoto } from "@/app/actions/progress-photos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";

interface ProgressPhotoUploadProps {
    patientId: string;
}

const photoTypes = [
    { value: "frontal", label: "Frontal" },
    { value: "lateral", label: "Lateral" },
    { value: "posterior", label: "Posterior" },
];

export function ProgressPhotoUpload({ patientId }: ProgressPhotoUploadProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [photoType, setPhotoType] = useState("frontal");
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            toast.success("Foto de progreso subida");
            setFile(null);
            setPreview(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al subir");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Subir foto de progreso
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Tipo de vista</Label>
                    <select
                        value={photoType}
                        onChange={(e) => setPhotoType(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        {photoTypes.map((t) => (
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
                    <div className="space-y-4">
                        <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg border">
                            <img
                                src={preview}
                                alt="Preview"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFile(null);
                                    setPreview(null);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleUpload} disabled={loading}>
                                {loading ? (
                                    "Subiendo..."
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Subir foto
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
                    >
                        <Camera className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm font-medium">Haz click para seleccionar una foto</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP hasta 10MB</p>
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
