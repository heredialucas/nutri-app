"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLocationQr } from "@/app/actions/locations";
import { toast } from "sonner";
import { Download, Loader2, QrCode } from "lucide-react";

interface QrDialogProps {
    locationId: string;
    locationName: string;
}

export function QrDialog({ locationId, locationName }: QrDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ url: string; dataUrl: string } | null>(null);

    const handleOpenChange = async (next: boolean) => {
        setOpen(next);
        if (next && !data) {
            setLoading(true);
            try {
                const result = await getLocationQr(locationId);
                setData({ url: result.url, dataUrl: result.dataUrl });
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Error al generar el QR");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDownload = () => {
        if (!data) return;
        const link = document.createElement("a");
        link.href = data.dataUrl;
        link.download = `qr-${locationName.toLowerCase().replace(/\s+/g, "-")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <QrCode className="h-3.5 w-3.5 mr-1.5" />
                    QR
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>QR de reserva</DialogTitle>
                    <DialogDescription>
                        Pegá este código en {locationName}. Quien lo escanee entra al chat de reserva
                        con la sede ya elegida.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                    {loading || !data ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-16">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generando QR...
                        </div>
                    ) : (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.dataUrl}
                                alt={`QR de reserva de ${locationName}`}
                                className="h-56 w-56 rounded-lg border"
                            />
                            <p className="text-xs text-muted-foreground break-all text-center">
                                {data.url}
                            </p>
                            <Button onClick={handleDownload} className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PNG
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
