"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createConsent } from "@/app/actions/consents";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Loader2, Upload } from "lucide-react";

const CONSENT_TYPES = [
    { value: "treatment", label: "Consentimiento de tratamiento" },
    { value: "photo", label: "Consentimiento fotográfico" },
    { value: "data", label: "Protección de datos" },
    { value: "general", label: "General" },
];

interface ConsentFormProps {
    patientId: string;
}

export function ConsentForm({ patientId }: ConsentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState("treatment");
    const [version, setVersion] = useState("");
    const [signature, setSignature] = useState("");
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const { upload, isUploading } = useImageUpload({
        preset: "consents",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let documentUrl: string | undefined;

            if (documentFile) {
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(documentFile);
                });

                const uploadResult = await upload(base64);
                if (uploadResult.success && uploadResult.url) {
                    documentUrl = uploadResult.url;
                } else {
                    toast.error(uploadResult.error || "Error al subir el documento");
                    setLoading(false);
                    return;
                }
            }

            await createConsent({
                patientId,
                type,
                version: version || undefined,
                signature: signature || undefined,
                documentUrl,
            });

            toast.success("Consentimiento registrado");
            setType("treatment");
            setVersion("");
            setSignature("");
            setDocumentFile(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al registrar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label>Tipo de consentimiento *</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CONSENT_TYPES.map((ct) => (
                                <SelectItem key={ct.value} value={ct.value}>
                                    {ct.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Versión</Label>
                    <Input
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="Ej: v1.0"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Label>Firma del paciente</Label>
                <Textarea
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Nombre completo o firma digital del paciente"
                    rows={2}
                />
            </div>

            <div className="space-y-1">
                <Label>Documento adjunto (opcional)</Label>
                <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    disabled={isUploading || loading}
                    className="file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground">
                    Imagen o PDF del documento de consentimiento firmado
                </p>
            </div>

            <Button type="submit" disabled={loading || isUploading}>
                {loading || isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                    </>
                ) : (
                    "Registrar consentimiento"
                )}
            </Button>
        </form>
    );
}
