import { getAppointmentById } from "@/app/actions/appointments";
import { locationService } from "@/services/location-service";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge, AppointmentTypeBadge } from "@/components/appointments/appointment-status-badge";
import { AppointmentStatusActions } from "@/components/appointments/appointment-status-actions";
import { ArrowLeft, User, MapPin, Video, Clock, CalendarDays } from "lucide-react";
import { minutesBetween } from "@/lib/appointment-rules";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

export const metadata = {
    title: "Detalle del turno",
    description: "Detalle de un turno",
};

function fmt(iso: string, pattern: string) {
    return formatInTimeZone(new Date(iso), AR_TZ, pattern, { locale: es });
}

export default async function AppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const { id } = await params;

    let appointment: Awaited<ReturnType<typeof getAppointmentById>> | null = null;
    try {
        appointment = await getAppointmentById(id);
    } catch {
        notFound();
    }
    if (!appointment) notFound();

    const locations = await locationService.listActive();
    const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    const initials = `${appointment.patient.firstName?.[0] ?? ""}${appointment.patient.lastName?.[0] ?? ""}`.toUpperCase();
    const startIso = appointment.startAt as unknown as string;
    const endIso = appointment.endAt as unknown as string;
    const duration = minutesBetween(new Date(startIso), new Date(endIso));

    const infoRows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
        { icon: <User className="h-4 w-4" />, label: "Profesional", value: appointment.professional?.fullName ?? "—" },
        {
            icon: <CalendarDays className="h-4 w-4" />,
            label: "Fecha",
            value: <span className="capitalize">{fmt(startIso, "EEEE d 'de' MMMM yyyy")}</span>,
        },
        {
            icon: <Clock className="h-4 w-4" />,
            label: "Horario",
            value: `${fmt(startIso, "HH:mm")}–${fmt(endIso, "HH:mm")} (${duration} min)`,
        },
    ];

    if (appointment.type === "IN_PERSON" && appointment.location) {
        infoRows.push({
            icon: <MapPin className="h-4 w-4" />,
            label: "Sede",
            value: appointment.location,
        });
    }

    if (appointment.type === "ONLINE" && appointment.meetingUrl) {
        infoRows.push({
            icon: <Video className="h-4 w-4" />,
            label: "Videollamada",
            value: (
                <a
                    href={appointment.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                >
                    {appointment.meetingUrl}
                </a>
            ),
        });
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/turnos">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a turnos
                </Link>
            </Button>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                                {initials || "?"}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold tracking-tight">{patientName}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <AppointmentStatusBadge status={appointment.status} />
                                    <AppointmentTypeBadge type={appointment.type} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {fmt(startIso, "EEEE d 'de' MMMM")} · {fmt(startIso, "HH:mm")}–{fmt(endIso, "HH:mm")} hs
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" asChild className="shrink-0">
                            <Link href={`/dashboard/pacientes/${appointment.patient.id}`}>Ver ficha del paciente</Link>
                        </Button>
                    </div>

                    <div className="mt-6 border-t pt-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                            Acciones
                        </p>
                        <AppointmentStatusActions
                            variant="detail"
                            showDetailLink={false}
                            locations={locations.map((l) => ({ id: l.id, name: l.name, address: l.address }))}
                            appointment={{
                                id: appointment.id,
                                patientId: appointment.patient.id,
                                patientName,
                                startAt: startIso,
                                endAt: endIso,
                                type: appointment.type,
                                status: appointment.status,
                                locationId: appointment.locationId ?? null,
                                meetingUrl: appointment.meetingUrl ?? null,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Información del turno</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {infoRows.map((row) => (
                            <div key={row.label} className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground">{row.icon}</div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{row.label}</p>
                                    <p className="text-sm font-medium break-words">{row.value}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {appointment.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {appointment.cancellationReason && (
                        <Card className="border-destructive/30">
                            <CardHeader>
                                <CardTitle className="text-base text-destructive">Motivo de cancelación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{appointment.cancellationReason}</p>
                            </CardContent>
                        </Card>
                    )}

                    {!appointment.notes && !appointment.cancellationReason && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
