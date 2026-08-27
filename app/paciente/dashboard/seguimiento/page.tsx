import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { patientService } from "@/services/patient-service";
import { followupService } from "@/services/followup-service";
import { ClipboardCheck, TrendingUp, Scale, Zap, Brain, AlertCircle } from "lucide-react";
import { FollowUpForm } from "@/components/patient-portal/followup-form";

const adherenceLabels: Record<string, string> = {
    excellent: "Excelente",
    good: "Buena",
    regular: "Regular",
    low: "Baja",
};

const energyLabels: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
};

export default async function SeguimientoPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (!isPatientUser(user)) redirect("/dashboard");

    const patient = await patientService.getByUserId(user.id);
    if (!patient) redirect("/auth/login");

    const followUps = await followupService.getByPatient(patient.id);

    // Check if already submitted this week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const thisWeek = followUps.find(
        (f: any) => new Date(f.weekStart).getTime() === monday.getTime()
    );

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">Seguimiento semanal</h1>
            <p className="text-sm text-[#666] mb-6 m-0">Registrá tu progreso y compartí cómo te sentís</p>

            {/* Weekly Check-in Form */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <ClipboardCheck size={16} className="text-[#1a1a1a]" />
                    <h2 className="text-sm font-semibold text-[#1a1a1a] m-0 uppercase tracking-wide">
                        {thisWeek ? "Tu control semanal de esta semana" : "Control semanal de esta semana"}
                    </h2>
                </div>
                <FollowUpForm
                    existingFollowUp={thisWeek ? {
                        id: thisWeek.id,
                        weight: thisWeek.weight ? Number(thisWeek.weight) : undefined,
                        adherence: thisWeek.adherence || undefined,
                        hunger: thisWeek.hunger || undefined,
                        energy: thisWeek.energy || undefined,
                        difficulties: thisWeek.difficulties || undefined,
                        patientNotes: thisWeek.patientNotes || undefined,
                    } : undefined}
                />
            </section>

            {/* History */}
            {followUps.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3 m-0 uppercase tracking-wide">
                        Historial
                    </h2>
                    <div className="space-y-2">
                        {followUps.map((fu: any) => {
                            const weekDate = new Date(fu.weekStart);
                            const weekLabel = weekDate.toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            });

                            return (
                                <div key={fu.id} className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-[#999]">
                                            Semana del {weekLabel}
                                        </span>
                                        {fu.proNotes && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] font-medium">
                                                Nota del profesional
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {fu.weight && (
                                            <div className="flex items-center gap-2">
                                                <Scale size={14} className="text-[#999]" />
                                                <div>
                                                    <span className="text-xs text-[#999] block">Peso</span>
                                                    <span className="text-sm font-semibold text-[#1a1a1a]">{fu.weight} kg</span>
                                                </div>
                                            </div>
                                        )}
                                        {fu.adherence && (
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={14} className="text-[#999]" />
                                                <div>
                                                    <span className="text-xs text-[#999] block">Adherencia</span>
                                                    <span className="text-sm font-semibold text-[#1a1a1a]">{adherenceLabels[fu.adherence] || fu.adherence}</span>
                                                </div>
                                            </div>
                                        )}
                                        {fu.energy && (
                                            <div className="flex items-center gap-2">
                                                <Zap size={14} className="text-[#999]" />
                                                <div>
                                                    <span className="text-xs text-[#999] block">Energía</span>
                                                    <span className="text-sm font-semibold text-[#1a1a1a]">{energyLabels[fu.energy] || fu.energy}</span>
                                                </div>
                                            </div>
                                        )}
                                        {fu.hunger && (
                                            <div className="flex items-center gap-2">
                                                <Brain size={14} className="text-[#999]" />
                                                <div>
                                                    <span className="text-xs text-[#999] block">Hambre</span>
                                                    <span className="text-sm font-semibold text-[#1a1a1a] capitalize">{fu.hunger}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {fu.difficulties && (
                                        <div className="mt-2 p-2 rounded-lg bg-[#fef2f2]">
                                            <p className="text-xs text-[#991b1b] m-0">
                                                <strong>Dificultades:</strong> {fu.difficulties}
                                            </p>
                                        </div>
                                    )}
                                    {fu.patientNotes && (
                                        <p className="text-xs text-[#666] mt-2 m-0 italic">
                                            "{fu.patientNotes}"
                                        </p>
                                    )}
                                    {fu.proNotes && (
                                        <div className="mt-2 p-2 rounded-lg bg-[#dcfce7]">
                                            <p className="text-xs text-[#166534] m-0">
                                                <strong>Nota de Mauro:</strong> {fu.proNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {followUps.length === 0 && (
                <div className="text-center py-8">
                    <ClipboardCheck size={36} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-3" />
                    <p className="text-sm text-[#666] m-0">
                        Aún no tenés seguimientos registrados. Completá tu primer control semanal arriba.
                    </p>
                </div>
            )}
        </div>
    );
}
