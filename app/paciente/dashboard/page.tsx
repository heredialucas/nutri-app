import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { patientService } from "@/services/patient-service";
import { appointmentService } from "@/services/appointment-service";
import { nutritionPlanService } from "@/services/nutrition-plan-service";
import { followupService } from "@/services/followup-service";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import {
    CalendarDays,
    Clock,
    MapPin,
    Video,
    UtensilsCrossed,
    ClipboardCheck,
    ArrowRight,
    Scale,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";

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

export default async function PacienteDashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (!isPatientUser(user)) redirect("/dashboard");

    const patient = await patientService.getByUserId(user.id);
    if (!patient) redirect("/auth/login");

    const [allAppointments, activePlan, latestFollowUp] = await Promise.all([
        appointmentService.list({ patientId: patient.id }),
        nutritionPlanService.getActiveForPatient(patient.id),
        followupService.getLatest(patient.id),
    ]);

    const nonCancelled = allAppointments.filter((a: any) => a.status !== "CANCELLED");
    const now = new Date();
    const upcoming = nonCancelled.filter((a: any) => new Date(a.startAt) >= now);
    const pending = nonCancelled.filter((a: any) => a.status === "PENDING" || a.status === "CONFIRMED");
    const past = nonCancelled.filter((a: any) => new Date(a.startAt) < now);

    const latestWeight = latestFollowUp?.weight;

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">
                Hola, {user.firstName || "paciente"}
            </h1>
            <p className="text-sm text-[#666] mb-8 m-0">
                Tu portal — Mauro Acosta
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                <Link
                    href="/paciente/dashboard/turnos"
                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white no-underline hover:border-[rgba(0,0,0,0.12)] transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                        <CalendarDays size={18} className="text-[#1a1a1a]" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-[#1a1a1a] m-0">{pending.length}</p>
                        <p className="text-xs text-[#666] m-0">Turnos activos</p>
                    </div>
                </Link>

                <Link
                    href="/paciente/dashboard/plan"
                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white no-underline hover:border-[rgba(0,0,0,0.12)] transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={18} className="text-[#1a1a1a]" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-[#1a1a1a] m-0">{activePlan ? "Activo" : "—"}</p>
                        <p className="text-xs text-[#666] m-0">Plan alimentario</p>
                    </div>
                </Link>

                <Link
                    href="/paciente/dashboard/seguimiento"
                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white no-underline hover:border-[rgba(0,0,0,0.12)] transition-colors col-span-2 md:col-span-1"
                >
                    <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                        <Scale size={18} className="text-[#1a1a1a]" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-[#1a1a1a] m-0">{latestWeight ? `${latestWeight} kg` : "—"}</p>
                        <p className="text-xs text-[#666] m-0">Peso actual</p>
                    </div>
                </Link>
            </div>

            {/* Appointments */}
            {(pending.length > 0 || upcoming.length > 0 || past.length > 0) && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-[#1a1a1a] m-0">
                            Mis turnos
                        </h2>
                        <Link
                            href="/paciente/dashboard/turnos"
                            className="text-xs text-[#666] hover:text-[#1a1a1a] no-underline flex items-center gap-1"
                        >
                            Ver todos <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        {pending.map((apt: any) => {
                            const aptDate = new Date(apt.startAt);
                            const formatted = formatInTimeZone(aptDate, AR_TZ, "EEE d MMM", { locale: es });
                            const time = formatInTimeZone(aptDate, AR_TZ, "HH:mm");

                            return (
                                <div
                                    key={apt.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                                >
                                    <div className="w-9 h-9 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                                        {apt.type === "ONLINE" ? (
                                            <Video size={16} className="text-[#1a1a1a]" />
                                        ) : (
                                            <MapPin size={16} className="text-[#1a1a1a]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-[#1a1a1a] capitalize block">
                                            {formatted}
                                        </span>
                                        <span className="text-xs text-[#666] flex items-center gap-1">
                                            <Clock size={11} /> {time} hs · {typeLabels[apt.type] || apt.type}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 ${statusColors[apt.status] || "text-[#666] bg-[#f3f4f6]"}`}>
                                        {statusLabels[apt.status] || apt.status}
                                    </span>
                                </div>
                            );
                        })}
                        {upcoming
                            .filter((apt: any) => apt.status !== "PENDING" && apt.status !== "CONFIRMED")
                            .slice(0, 3)
                            .map((apt: any) => {
                                const aptDate = new Date(apt.startAt);
                                const formatted = formatInTimeZone(aptDate, AR_TZ, "EEE d MMM", { locale: es });
                                const time = formatInTimeZone(aptDate, AR_TZ, "HH:mm");

                                return (
                                    <div
                                        key={apt.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                                            {apt.type === "ONLINE" ? (
                                                <Video size={16} className="text-[#1a1a1a]" />
                                            ) : (
                                                <MapPin size={16} className="text-[#1a1a1a]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-[#1a1a1a] capitalize block">
                                                {formatted}
                                            </span>
                                            <span className="text-xs text-[#666] flex items-center gap-1">
                                                <Clock size={11} /> {time} hs · {typeLabels[apt.type] || apt.type}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 ${statusColors[apt.status] || "text-[#666] bg-[#f3f4f6]"}`}>
                                            {statusLabels[apt.status] || apt.status}
                                        </span>
                                    </div>
                                );
                            })}
                        {past.length > 0 && (
                            <p className="text-[10px] text-[#999] mt-1 m-0">
                                +{past.length} turno{past.length !== 1 ? "s" : ""} anterior{past.length !== 1 ? "es" : ""}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* Active Plan Preview */}
            {activePlan && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-[#1a1a1a] m-0">
                            Mi plan alimentario
                        </h2>
                        <Link
                            href="/paciente/dashboard/plan"
                            className="text-xs text-[#666] hover:text-[#1a1a1a] no-underline flex items-center gap-1"
                        >
                            Ver completo <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <h3 className="text-sm font-semibold text-[#1a1a1a] m-0 mb-1">{activePlan.title}</h3>
                        {activePlan.description && (
                            <p className="text-xs text-[#666] m-0 mb-3">{activePlan.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {activePlan.calorieTarget && (
                                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-[rgba(0,0,0,0.03)] text-[#666]">
                                    {activePlan.calorieTarget} kcal/día
                                </span>
                            )}
                            <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-[rgba(0,0,0,0.03)] text-[#666]">
                                {activePlan.days?.length || 0} días
                            </span>
                        </div>
                    </div>
                </section>
            )}

            {/* Latest Follow-up */}
            {latestFollowUp && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-[#1a1a1a] m-0">
                            Último seguimiento
                        </h2>
                        <Link
                            href="/paciente/dashboard/seguimiento"
                            className="text-xs text-[#666] hover:text-[#1a1a1a] no-underline flex items-center gap-1"
                        >
                            Ver historial <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <div className="flex items-center gap-4 text-sm">
                            {latestFollowUp.weight && (
                                <div>
                                    <span className="text-xs text-[#666] block">Peso</span>
                                    <span className="font-semibold text-[#1a1a1a]">{latestFollowUp.weight?.toString()} kg</span>
                                </div>
                            )}
                            {latestFollowUp.adherence && (
                                <div>
                                    <span className="text-xs text-[#666] block">Adherencia</span>
                                    <span className="font-semibold text-[#1a1a1a] capitalize">{latestFollowUp.adherence}</span>
                                </div>
                            )}
                            {latestFollowUp.energy && (
                                <div>
                                    <span className="text-xs text-[#666] block">Energía</span>
                                    <span className="font-semibold text-[#1a1a1a] capitalize">{latestFollowUp.energy}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-[#999] mt-2 m-0">
                            {new Date(latestFollowUp.createdAt).toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </section>
            )}

            {/* Empty State */}
            {pending.length === 0 && upcoming.length === 0 && (
                <div className="text-center py-12">
                    <CalendarDays size={36} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-[#1a1a1a] mb-1 m-0">
                        Sin turnos programados
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
        </div>
    );
}
