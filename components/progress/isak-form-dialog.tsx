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
import { Plus, Activity, Pencil } from "lucide-react";
import { IsakForm } from "./isak-form";

interface IsakFormDialogProps {
    patientId: string;
    label?: string;
    assessment?: Record<string, unknown>;
}

export function IsakFormDialog({ patientId, label = "Nueva evaluación", assessment }: IsakFormDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    {assessment ? <Pencil className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl sm:max-h-[85vh] sm:overflow-y-auto max-sm:max-h-[90vh] max-sm:overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Evaluación corporal ISAK
                    </DialogTitle>
                </DialogHeader>
                <IsakForm patientId={patientId} assessment={assessment} embedded onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
