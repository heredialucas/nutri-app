"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge, AppointmentTypeBadge } from "./appointment-status-badge";
import { updateAppointment, cancelAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { Video, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

interface Appointment {
    id: string;
    startAt: string;
    endAt: string;
    type: string;
    status: string;
    notes?: string | null;
    meetingUrl?: string | null;
    patient: { id: string; firstName: string; lastName: string };
}

function formatDateTime(iso: string) {
    const d = new Date(iso);
    return {
        date: formatInTimeZone(d, AR_TZ, "EEE d MMM", { locale: es }),
        time: formatInTimeZone(d, AR_TZ, "HH:mm"),
    };
}

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleStatusChange = async (id: string, status: string) => {
        setLoadingId(id);
        try {
            if (status === "CANCELLED") {
                await cancelAppointment(id);
            } else {
                await updateAppointment(id, { status: status as any });
            }
            toast.success("Turno actualizado");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoadingId(null);
        }
    };

    if (appointments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No hay turnos para mostrar</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {appointments.map((a) => {
                const { date, time } = formatDateTime(a.startAt);
                const endTime = formatInTimeZone(new Date(a.endAt), AR_TZ, "HH:mm");

                return (
                    <div
                        key={a.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="text-center min-w-[60px]">
                                <p className="text-xs text-muted-foreground uppercase">{date}</p>
                                <p className="text-sm font-mono font-medium">{time}</p>
                            </div>
                            <div className="min-w-0">
                                <Link
                                    href={`/dashboard/pacientes/${a.patient.id}`}
                                    className="text-sm font-medium hover:underline"
                                >
                                    {a.patient.firstName} {a.patient.lastName}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <AppointmentTypeBadge type={a.type} />
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {endTime}
                                    </span>
                                    {a.type === "ONLINE" && a.meetingUrl && (
                                        <a
                                            href={a.meetingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Video className="h-3 w-3" />
                                            Videollamada
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <AppointmentStatusBadge status={a.status} />
                            {a.status === "PENDING" && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="h-8 px-3 text-xs gap-1"
                                        disabled={loadingId === a.id}
                                        onClick={() => handleStatusChange(a.id, "CONFIRMED")}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 px-3 text-xs gap-1"
                                        disabled={loadingId === a.id}
                                        onClick={() => handleStatusChange(a.id, "CANCELLED")}
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
