import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ArrowRight } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

interface Appointment {
    id: string;
    startAt: string;
    endAt: string;
    type: string;
    status: string;
    patient: { id: string; firstName: string; lastName: string };
}

function formatTime(iso: string) {
    return formatInTimeZone(new Date(iso), AR_TZ, "HH:mm");
}

function statusLabel(status: string) {
    const labels: Record<string, string> = {
        PENDING: "Pendiente",
        CONFIRMED: "Confirmado",
        COMPLETED: "Completado",
        CANCELLED: "Cancelado",
        NO_SHOW: "No asistió",
        RESCHEDULED: "Reprogramado",
    };
    return labels[status] || status;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "CONFIRMED": return "default";
        case "COMPLETED": return "secondary";
        case "CANCELLED": return "destructive";
        case "NO_SHOW": return "destructive";
        case "PENDING": return "outline";
        default: return "outline";
    }
}

export function TodayAppointments({ appointments }: { appointments: Appointment[] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                    Turnos de hoy
                </CardTitle>
                <Link
                    href="/dashboard/turnos"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                    Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent>
                {appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        No tenés turnos programados para hoy
                    </p>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-mono text-muted-foreground">
                                        {formatTime(a.startAt)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {a.patient.firstName} {a.patient.lastName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {a.type === "ONLINE" ? "Online" : "Presencial"}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={statusVariant(a.status)}>
                                    {statusLabel(a.status)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
