"use client";

import Link from "next/link";
import { AppointmentStatusBadge, AppointmentTypeBadge } from "./appointment-status-badge";
import { AppointmentStatusActions } from "./appointment-status-actions";
import { Video, MapPin } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { LocationOption } from "./appointment-form-dialog";

const AR_TZ = "America/Argentina/Buenos_Aires";

interface Appointment {
    id: string;
    patientId: string;
    startAt: string;
    endAt: string;
    type: string;
    status: string;
    notes?: string | null;
    meetingUrl?: string | null;
    location?: string | null;
    locationId?: string | null;
    patient: { id: string; firstName: string; lastName: string };
}

function formatDateTime(iso: string) {
    const d = new Date(iso);
    return {
        date: formatInTimeZone(d, AR_TZ, "EEE d MMM", { locale: es }),
        time: formatInTimeZone(d, AR_TZ, "HH:mm"),
    };
}

const statusAccent: Record<string, string> = {
    PENDING: "border-l-amber-400",
    CONFIRMED: "border-l-emerald-500",
    COMPLETED: "border-l-sky-500",
    CANCELLED: "border-l-rose-500",
    NO_SHOW: "border-l-rose-500",
    RESCHEDULED: "border-l-violet-500",
};

export function AppointmentList({
    appointments,
    locations = [],
}: {
    appointments: Appointment[];
    locations?: LocationOption[];
}) {
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
                        className={`flex flex-col gap-4 p-4 rounded-lg border border-l-4 bg-card hover:bg-accent/40 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                            statusAccent[a.status] ?? "border-l-border"
                        }`}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="flex flex-col items-center justify-center rounded-md bg-muted px-3 py-2 min-w-[64px]">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{date}</p>
                                <p className="text-sm font-mono font-semibold">{time}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">a {endTime}</p>
                            </div>
                            <div className="min-w-0">
                                <Link
                                    href={`/dashboard/pacientes/${a.patient.id}`}
                                    className="text-sm font-semibold hover:underline"
                                >
                                    {a.patient.firstName} {a.patient.lastName}
                                </Link>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <AppointmentStatusBadge status={a.status} />
                                    <AppointmentTypeBadge type={a.type} />
                                    {a.type === "IN_PERSON" && a.location && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {a.location}
                                        </span>
                                    )}
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
                                    {a.notes && (
                                        <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                                            {a.notes}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="shrink-0 sm:pl-2">
                            <AppointmentStatusActions
                                locations={locations}
                                appointment={{
                                    id: a.id,
                                    patientId: a.patient.id,
                                    patientName: `${a.patient.firstName} ${a.patient.lastName}`,
                                    startAt: a.startAt,
                                    endAt: a.endAt,
                                    type: a.type as "ONLINE" | "IN_PERSON",
                                    status: a.status,
                                    locationId: a.locationId ?? null,
                                    meetingUrl: a.meetingUrl ?? null,
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
