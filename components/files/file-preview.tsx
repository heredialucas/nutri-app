"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
}

export function FilePreview({
    open,
    onOpenChange,
    fileName,
    fileUrl,
    mimeType,
}: FilePreviewProps) {
    const isImage = mimeType?.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-base truncate pr-4">
                        {fileName}
                    </DialogTitle>
                    <Button variant="outline" size="sm" asChild>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Abrir
                        </a>
                    </Button>
                </DialogHeader>

                <div className="flex-1 overflow-auto min-h-0">
                    {isImage ? (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="w-full h-auto rounded-md object-contain max-h-[70vh]"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={fileUrl}
                            title={fileName}
                            className="w-full min-h-[60vh] rounded-md border"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <p className="text-sm">Vista previa no disponible para este tipo de archivo.</p>
                            <Button variant="outline" size="sm" className="mt-4" asChild>
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
