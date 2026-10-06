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
import { getGeneralQr } from "@/app/actions/locations";
import { toast } from "sonner";
import { Download, Loader2, QrCode } from "lucide-react";

export function QrDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ url: string; dataUrl: string } | null>(null);

    const handleOpenChange = async (next: boolean) => {
        setOpen(next);
        if (next && !data) {
            setLoading(true);
            try {
                const result = await getGeneralQr();
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
        link.download = "qr-reserva-turnos.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <QrCode className="h-3.5 w-3.5 mr-1.5" />
                    Ver QR general
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>QR general de reserva</DialogTitle>
                    <DialogDescription>
                        Pegá este código en tus sedes. Quien lo escanee entra al chat de reserva
                        y elige la sucursal.
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
                                alt="QR general de reserva de turnos"
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
