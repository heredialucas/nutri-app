"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    updateAppointment,
    markAppointmentCompleted,
    markAppointmentNoShow,
} from "@/app/actions/appointments";
import { AppointmentRescheduleDialog, type ReschedulableAppointment } from "./appointment-reschedule-dialog";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";
import { toast } from "sonner";
import {
    CalendarClock,
    CheckCircle2,
    UserX,
    XCircle,
    ClipboardCheck,
    Loader2,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LocationOption } from "./appointment-form-dialog";

export interface AppointmentActionsData extends ReschedulableAppointment {
    status: string;
    patientId: string;
}

export function AppointmentStatusActions({
    appointment,
    locations,
    variant = "list",
    showDetailLink,
}: {
    appointment: AppointmentActionsData;
    locations: LocationOption[];
    variant?: "list" | "detail";
    showDetailLink?: boolean;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const run = async (fn: () => Promise<unknown>, message: string) => {
        setLoading(true);
        try {
            await fn();
            toast.success(message);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoading(false);
        }
    };

    const isFinished = ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(appointment.status);
    const size = variant === "detail" ? "default" : "sm";
    const withDetailLink = showDetailLink ?? variant === "list";

    return (
        <>
            <div className={cn("flex flex-wrap items-center gap-2", variant === "detail" && "gap-2.5")}>
                {withDetailLink && (
                    <Button variant="outline" size={size} asChild>
                        <Link href={`/dashboard/turnos/${appointment.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detalle
                        </Link>
                    </Button>
                )}

                {appointment.status === "PENDING" && (
                    <Button
                        size={size}
                        disabled={loading}
                        onClick={() =>
                            run(
                                () => updateAppointment(appointment.id, { status: "CONFIRMED" }),
                                "Turno confirmado",
                            )
                        }
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar
                    </Button>
                )}

                {!isFinished && (
                    <>
                        <Button
                            variant="outline"
                            size={size}
                            disabled={loading}
                            onClick={() =>
                                run(() => markAppointmentCompleted(appointment.id), "Turno marcado como completado")
                            }
                        >
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Completar
                        </Button>
                        <Button
                            variant="outline"
                            size={size}
                            disabled={loading}
                            onClick={() => run(() => markAppointmentNoShow(appointment.id), "Turno marcado como ausente")}
                        >
                            <UserX className="mr-2 h-4 w-4" />
                            Ausente
                        </Button>
                        <Button
                            variant="outline"
                            size={size}
                            disabled={loading}
                            onClick={() => setRescheduleOpen(true)}
                        >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Reprogramar
                        </Button>
                        <Button
                            variant="outline"
                            size={size}
                            disabled={loading}
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setCancelOpen(true)}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                    </>
                )}

                {isFinished && !withDetailLink && (
                    <p className="text-sm text-muted-foreground">Este turno ya está cerrado.</p>
                )}

                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            <AppointmentRescheduleDialog
                appointment={appointment}
                locations={locations}
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
            />
            <CancelAppointmentDialog
                appointmentId={appointment.id}
                patientName={appointment.patientName}
                open={cancelOpen}
                onOpenChange={setCancelOpen}
            />
        </>
    );
}
