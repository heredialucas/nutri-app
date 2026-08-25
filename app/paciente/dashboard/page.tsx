import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { patientService } from "@/services/patient-service";
import { appointmentService } from "@/services/appointment-service";
import { CalendarDays, Clock, MapPin, Video } from "lucide-react";
import Link from "next/link";

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

export default async function PacienteDashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (!isPatientUser(user)) redirect("/dashboard");

    const patient = await patientService.getByUserId(user.id);

    let appointments: any[] = [];
    if (patient) {
        const all = await appointmentService.list({ patientId: patient.id });
        appointments = all.filter((a: any) => a.status !== "CANCELLED");
    }

    const now = new Date();
    const upcoming = appointments.filter((a: any) => new Date(a.startAt) >= now);
    const past = appointments.filter((a: any) => new Date(a.startAt) < now);

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">
                Hola, {user.firstName || "paciente"}
            </h1>
            <p className="text-sm text-[#666] mb-8 m-0">
                Tu portal de pacientes — Mauro Acosta
            </p>

            {upcoming.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4 m-0">
                        Próximos turnos
                    </h2>
                    <div className="flex flex-col gap-3">
                        {upcoming.map((apt: any) => {
                            const date = new Date(apt.startAt);
                            const formatted = date.toLocaleDateString("es-AR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                            });
                            const time = date.toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                            return (
                                <div
                                    key={apt.id}
                                    className="flex items-start gap-4 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                                        {apt.type === "ONLINE" ? (
                                            <Video size={18} className="text-[#1a1a1a]" />
                                        ) : (
                                            <MapPin size={18} className="text-[#1a1a1a]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-[#1a1a1a] capitalize">
                                                {formatted}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#666]">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {time} hs
                                            </span>
                                            <span>{typeLabels[apt.type] || apt.type}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-[#eab308] bg-[#fef9c3] px-2 py-1 rounded-md shrink-0">
                                        {statusLabels[apt.status] || apt.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {past.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4 m-0">
                        Turnos anteriores
                    </h2>
                    <div className="flex flex-col gap-3">
                        {past.slice(0, 5).map((apt: any) => {
                            const date = new Date(apt.startAt);
                            const formatted = date.toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            });
                            const time = date.toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                            return (
                                <div
                                    key={apt.id}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-[rgba(0,0,0,0.04)] bg-white opacity-70"
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-[#1a1a1a] capitalize">{formatted}</span>
                                        <span className="text-xs text-[#999] ml-2">{time} hs</span>
                                    </div>
                                    <span className="text-xs text-[#999]">
                                        {statusLabels[apt.status] || apt.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {appointments.length === 0 && (
                <div className="text-center py-16">
                    <CalendarDays size={40} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2 m-0">
                        Sin turnos
                    </h2>
                    <p className="text-sm text-[#666] mb-6 m-0">
                        Aún no tenés turnos reservados.
                    </p>
                    <Link
                        href="/reservar"
                        className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold no-underline transition-colors hover:bg-[#333]"
                    >
                        Reservar turno
                    </Link>
                </div>
            )}
        </div>
    );
}
