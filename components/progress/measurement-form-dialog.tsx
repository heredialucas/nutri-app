"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Ruler, Plus } from "lucide-react";
import { MeasurementForm } from "./measurement-form";

interface MeasurementFormDialogProps {
    patientId: string;
}

export function MeasurementFormDialog({ patientId }: MeasurementFormDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Nueva medición
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl sm:max-h-[85vh] sm:overflow-y-auto max-sm:max-h-[90vh] max-sm:overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Nueva medición
                    </DialogTitle>
                </DialogHeader>
                <MeasurementForm patientId={patientId} embedded onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}