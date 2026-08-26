import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { patientService } from "@/services/patient-service";
import { appointmentService } from "@/services/appointment-service";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, Video, XCircle } from "lucide-react";
import Link from "next/link";
import { CancelAppointmentButton } from "@/components/patient-portal/cancel-appointment-button";

const AR_TZ = "America/Argentina/Buenos_Aires";

const typeLabels: Record<string, string> = {
    IN_PERSON: "Presencial",
    ONLINE: "Online",
};

const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    NO_SHOW: "No asistió",
    RESCHEDULED: "Reprogramado",
};

const statusColors: Record<string, string> = {
    PENDING: "text-[#eab308] bg-[#fef9c3]",
    CONFIRMED: "text-[#22c55e] bg-[#dcfce7]",
    COMPLETED: "text-[#6b7280] bg-[#f3f4f6]",
    CANCELLED: "text-[#ef4444] bg-[#fef2f2]",
    NO_SHOW: "text-[#f97316] bg-[#fff7ed]",
    RESCHEDULED: "text-[#3b82f6] bg-[#eff6ff]",
};

export default async function TurnosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (!isPatientUser(user)) redirect("/dashboard");

    const patient = await patientService.getByUserId(user.id);
    if (!patient) redirect("/auth/login");

    const allAppointments = await appointmentService.list({ patientId: patient.id });
    const now = new Date();
    const upcoming = allAppointments.filter((a: any) => new Date(a.startAt) >= now && a.status !== "CANCELLED");
    const past = allAppointments.filter((a: any) => new Date(a.startAt) < now && a.status !== "CANCELLED");
    const cancelled = allAppointments.filter((a: any) => a.status === "CANCELLED");

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">Mis turnos</h1>
            <p className="text-sm text-[#666] mb-6 m-0">Gestioná tus citas con Mauro Acosta</p>

            {upcoming.length === 0 && (
                <div className="text-center py-12 mb-8">
                    <CalendarDays size={36} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-[#1a1a1a] mb-1 m-0">
                        Sin turnos próximos
                    </h2>
                    <p className="text-sm text-[#666] mb-4 m-0">
                        Reservá tu próximo turno con Mauro Acosta.
                    </p>
                    <Link
                        href="/reservar"
                        className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold no-underline transition-colors hover:bg-[#333]"
                    >
                        Reservar turno
                    </Link>
                </div>
            )}

            {upcoming.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3 m-0 uppercase tracking-wide">
                        Próximos
                    </h2>
                    <div className="flex flex-col gap-2">
                        {upcoming.map((apt: any) => {
                            const aptDate = new Date(apt.startAt);
                            const formatted = formatInTimeZone(aptDate, AR_TZ, "EEEE d 'de' MMMM", { locale: es });
                            const time = formatInTimeZone(aptDate, AR_TZ, "HH:mm");

                            return (
                                <div
                                    key={apt.id}
                                    className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 mt-0.5">
                                        {apt.type === "ONLINE" ? (
                                            <Video size={18} className="text-[#1a1a1a]" />
                                        ) : (
                                            <MapPin size={18} className="text-[#1a1a1a]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-[#1a1a1a] capitalize block">
                                            {formatted}
                                        </span>
                                        <div className="flex items-center gap-3 text-xs text-[#666] mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {time} hs
                                            </span>
                                            <span>{typeLabels[apt.type] || apt.type}</span>
                                        </div>
                                        {apt.location && apt.type === "IN_PERSON" && (
                                            <span className="text-xs text-[#999] mt-1 block">{apt.location}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${statusColors[apt.status] || "text-[#666] bg-[#f3f4f6]"}`}>
                                            {statusLabels[apt.status] || apt.status}
                                        </span>
                                        {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                                            <CancelAppointmentButton appointmentId={apt.id} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {past.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3 m-0 uppercase tracking-wide">
                        Anteriores
                    </h2>
                    <div className="flex flex-col gap-2">
                        {past.slice(0, 10).map((apt: any) => {
                            const aptDate = new Date(apt.startAt);
                            const formatted = formatInTimeZone(aptDate, AR_TZ, "d 'de' MMMM 'de' yyyy", { locale: es });
                            const time = formatInTimeZone(aptDate, AR_TZ, "HH:mm");

                            return (
                                <div
                                    key={apt.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(0,0,0,0.04)] bg-white opacity-70"
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-[#1a1a1a] capitalize">{formatted}</span>
                                        <span className="text-xs text-[#999] ml-2">{time} hs · {typeLabels[apt.type] || apt.type}</span>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${statusColors[apt.status] || "text-[#666] bg-[#f3f4f6]"}`}>
                                        {statusLabels[apt.status] || apt.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
