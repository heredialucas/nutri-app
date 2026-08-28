import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatientById, reactivatePatient } from "@/app/actions/patients";
import { getPatientFiles } from "@/app/actions/files";
import { getProgressPhotos } from "@/app/actions/progress-photos";
import { getConsents } from "@/app/actions/consents";
import { getMeasurements, getEvolutionData, getLatestMeasurement } from "@/app/actions/measurements";
import { getFollowUps } from "@/app/actions/followups";
import { getNutritionPlans } from "@/app/actions/nutrition-plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PatientFileManager } from "@/components/patient/patient-file-manager";
import { PatientPhotosManager } from "@/components/patient/patient-photos-manager";
import { PatientConsentManager } from "@/components/patient/patient-consent-manager";
import { EvolutionSummary } from "@/components/progress/evolution-summary";
import { ProgressChart } from "@/components/progress/progress-chart";
import { MeasurementForm } from "@/components/progress/measurement-form";
import { MeasurementHistory } from "@/components/progress/measurement-history";
import { FollowUpSummary } from "@/components/followups/followup-summary";
import { FollowUpForm } from "@/components/followups/followup-form";
import { FollowUpList } from "@/components/followups/followup-list";
import { PatientPlanHistory } from "@/components/nutrition-plans/patient-plan-history";
import {
    ArrowLeft,
    Pencil,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Activity,
    UtensilsCrossed,
    ClipboardList,
    TrendingUp,
    FolderOpen,
    ClipboardCheck,
    Images,
    Camera,
    User,
    AlertCircle,
    Pill,
    RotateCcw,
    Plus,
} from "lucide-react";

export const metadata = {
    title: "Detalle del paciente",
};

function formatDate(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function billingLabel(type: string) {
    const labels: Record<string, string> = {
        PARTICULAR: "Particular",
        OBRA_SOCIAL: "Obra social",
        MIXTO: "Mixto",
    };
    return labels[type] || type;
}

export default async function PatientDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    let patient: any;
    try {
        patient = await getPatientById(id);
    } catch {
        notFound();
    }

    const [files, photos, consents, measurements, evolutionData, latestMeasurement, followUps, patientPlans] =
        await Promise.all([
            getPatientFiles(id).catch(() => []),
            getProgressPhotos(id).catch(() => []),
            getConsents(id).catch(() => []),
            getMeasurements(id).catch(() => []),
            getEvolutionData(id).catch(() => []),
            getLatestMeasurement(id).catch(() => null),
            getFollowUps(id).catch(() => []),
            getNutritionPlans({ patientId: id }).catch(() => []),
        ]);

    const sortedMeasurements = [...measurements].sort(
        (a: any, b: any) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
    );
    const previousMeasurement = sortedMeasurements[1] || null;

    const sortedFollowUps = [...followUps].sort(
        (a: any, b: any) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    const latestFollowUp = sortedFollowUps[0] || null;
    const previousFollowUp = sortedFollowUps[1] || null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Link
                        href="/dashboard/pacientes"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Pacientes
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                    variant={patient.deletedAt ? "destructive" : patient.status === "ACTIVE" ? "default" : "secondary"}
                                    className="text-xs"
                                >
                                    {patient.deletedAt ? "Eliminado" : patient.status === "ACTIVE" ? "Activo" : "Archivado"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {billingLabel(patient.billingType)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {patient.deletedAt && (
                        <form action={reactivatePatient.bind(null, id)}>
                            <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-600/40 hover:bg-emerald-500/10">
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                Activar cuenta
                            </Button>
                        </form>
                    )}
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/pacientes/${id}/edit`}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Editar
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
                {[
                    { icon: Activity, label: "Mediciones", value: patient._count.measurements, color: "text-blue-500" },
                    { icon: Calendar, label: "Turnos", value: patient._count.appointments, color: "text-amber-500" },
                    { icon: UtensilsCrossed, label: "Planes", value: patient._count.nutritionPlans, color: "text-emerald-500" },
                    { icon: ClipboardList, label: "Seguimientos", value: patient._count.followUps, color: "text-purple-500" },
                    { icon: FolderOpen, label: "Archivos", value: patient._count.files, color: "text-sky-500" },
                    { icon: ClipboardCheck, label: "Consent.", value: patient._count.consents, color: "text-rose-500" },
                ].map((stat) => (
                    <Card key={stat.label} className="py-0">
                        <CardContent className="p-3 flex items-center gap-2.5">
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            <div>
                                <p className="text-lg font-bold leading-none">{stat.value}</p>
                                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Patient Info + Clinical Info */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Datos personales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Nacimiento:</span>
                            <span>{formatDate(patient.birthDate)}</span>
                        </div>
                        {patient.documentNumber && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">DNI:</span>
                                <span>{patient.documentNumber}</span>
                            </div>
                        )}
                        {patient.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{patient.email}</span>
                            </div>
                        )}
                        {patient.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{patient.phone}</span>
                            </div>
                        )}
                        {patient.address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                    {patient.address}
                                    {patient.city ? `, ${patient.city}` : ""}
                                </span>
                            </div>
                        )}
                        {patient.occupation && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground ml-[22px]">Ocupación: </span>
                                <span>{patient.occupation}</span>
                            </div>
                        )}
                        {patient.healthInsurance && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground ml-[22px]">Obra social: </span>
                                <span>{patient.healthInsurance}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Información adicional
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5 text-sm">
                        {patient.emergencyContact && (
                            <div>
                                <span className="text-muted-foreground">Contacto de emergencia: </span>
                                <span>{patient.emergencyContact}</span>
                                {patient.emergencyPhone && ` (${patient.emergencyPhone})`}
                            </div>
                        )}
                        {patient.notes && (
                            <div>
                                <span className="text-muted-foreground">Notas: </span>
                                <span>{patient.notes}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-muted-foreground">Registrado: </span>
                            <span>{formatDate(patient.createdAt)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Allergies + Medications */}
            {(patient.allergies.length > 0 || patient.medications.length > 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {patient.allergies.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                    Alergias
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5">
                                    {patient.allergies.map((a: any) => (
                                        <Badge key={a.id} variant="destructive" className="text-xs">
                                            {a.name}
                                            {a.severity && ` (${a.severity})`}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {patient.medications.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-blue-500" />
                                    Medicación
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1.5">
                                    {patient.medications.map((m: any) => (
                                        <div key={m.id} className="text-sm">
                                            <span className="font-medium">{m.name}</span>
                                            {m.dosage && <span className="text-muted-foreground"> — {m.dosage}</span>}
                                            {m.frequency && <span className="text-muted-foreground"> ({m.frequency})</span>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Accordion Sections */}
            <Accordion type="multiple" className="space-y-3" defaultValue={[]}>
                {/* Evolución */}
                <AccordionItem value="evolucion" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-semibold">Evolución y mediciones</span>
                            {measurements.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {measurements.length}
                                </Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1">
                        {latestMeasurement && (
                            <EvolutionSummary latest={latestMeasurement as any} previous={previousMeasurement as any} />
                        )}
                        <ProgressChart data={evolutionData} />
                        <div className="grid gap-4 lg:grid-cols-2">
                            <MeasurementForm patientId={id} />
                            <PatientPhotosManager patientId={id} photos={photos as any} />
                        </div>
                        <MeasurementHistory measurements={measurements as any} />
                    </AccordionContent>
                </AccordionItem>

                {/* Seguimiento semanal */}
                <AccordionItem value="seguimiento" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2.5">
                            <ClipboardList className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-semibold">Seguimiento semanal</span>
                            {followUps.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {followUps.length}
                                </Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1">
                        {latestFollowUp && (
                            <FollowUpSummary current={latestFollowUp} previous={previousFollowUp} />
                        )}
                        <FollowUpForm patientId={id} />
                        <FollowUpList followUps={followUps} patientId={id} />
                    </AccordionContent>
                </AccordionItem>

                {/* Planes alimentarios */}
                <AccordionItem value="planes" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2.5">
                            <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-semibold">Planes alimentarios</span>
                            {patientPlans.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {patientPlans.length}
                                </Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-sm text-muted-foreground m-0">
                                Historial de planes y seguimiento nutricional del paciente
                            </p>
                            <Button asChild size="sm">
                                <Link href={`/dashboard/planes/new?patientId=${id}`}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Nuevo plan
                                </Link>
                            </Button>
                        </div>
                        <PatientPlanHistory patientId={id} plans={patientPlans as any} />
                    </AccordionContent>
                </AccordionItem>

                {/* Archivos médicos */}
                <AccordionItem value="archivos" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2.5">
                            <FolderOpen className="h-4 w-4 text-sky-500" />
                            <span className="text-sm font-semibold">Archivos médicos</span>
                            {files.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {files.length}
                                </Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1">
                        <PatientFileManager patientId={id} files={files as any} />
                    </AccordionContent>
                </AccordionItem>

                {/* Consentimientos */}
                <AccordionItem value="consentimientos" className="border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2.5">
                            <ClipboardCheck className="h-4 w-4 text-rose-500" />
                            <span className="text-sm font-semibold">Consentimientos</span>
                            {consents.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {consents.length}
                                </Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1">
                        <PatientConsentManager patientId={id} consents={consents as any} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
