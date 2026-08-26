"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { createConsent, deleteConsent } from "@/app/actions/consents";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Loader2, Upload, Trash2, ExternalLink, FileCheck, Plus } from "lucide-react";

const CONSENT_TYPES = [
    { value: "treatment", label: "Consentimiento de tratamiento" },
    { value: "photo", label: "Consentimiento fotográfico" },
    { value: "data", label: "Protección de datos" },
    { value: "general", label: "General" },
];

const TYPE_LABELS: Record<string, string> = {
    treatment: "Tratamiento",
    photo: "Fotográfico",
    data: "Protección datos",
    general: "General",
};

interface Consent {
    id: string;
    type: string;
    version?: string | null;
    signedAt: string;
    signature?: string | null;
    ipAddress?: string | null;
    documentUrl?: string | null;
}

interface PatientConsentManagerProps {
    patientId: string;
    consents: Consent[];
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function PatientConsentManager({ patientId, consents }: PatientConsentManagerProps) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState("treatment");
    const [version, setVersion] = useState("");
    const [signature, setSignature] = useState("");
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { upload, isUploading } = useImageUpload({ preset: "consents" });

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
                    toast.error(uploadResult.error || "Error al subir");
                    setLoading(false);
                    return;
                }
            }

            await createConsent({ patientId, type, version: version || undefined, signature: signature || undefined, documentUrl });
            toast.success("Consentimiento registrado");
            setType("treatment");
            setVersion("");
            setSignature("");
            setDocumentFile(null);
            setShowForm(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al registrar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteConsent(deleteId);
            toast.success("Consentimiento eliminado");
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
            {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">Nuevo consentimiento</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Tipo *</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-9">
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
                            <Label className="text-xs">Versión</Label>
                            <Input
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="v1.0"
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Firma del paciente</Label>
                        <Textarea
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                            placeholder="Nombre completo o firma"
                            rows={2}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Documento adjunto (opcional)</Label>
                        <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            disabled={isUploading || loading}
                            className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={loading || isUploading}>
                            {(loading || isUploading) && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Registrar
                        </Button>
                    </div>
                </form>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Nuevo consentimiento
                </Button>
            )}

            {consents.length > 0 ? (
                <div className="space-y-1.5">
                    {consents.map((consent) => (
                        <div
                            key={consent.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                        >
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                {consent.documentUrl ? (
                                    <FileCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {TYPE_LABELS[consent.type] || consent.type}
                                    </Badge>
                                    {consent.version && (
                                        <span className="text-xs text-muted-foreground">{consent.version}</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDate(consent.signedAt)}
                                    {consent.signature && " · Firmado"}
                                </p>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {consent.documentUrl && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                        <a href={consent.documentUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteId(consent.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                    No hay consentimientos registrados.
                </p>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar consentimiento</AlertDialogTitle>
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
        </div>
    );
}
