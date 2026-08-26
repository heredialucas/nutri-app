import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {patient.firstName} {patient.lastName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"}>
                            {patient.status === "ACTIVE" ? "Activo" : "Archivado"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {billingLabel(patient.billingType)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/pacientes/${id}/archivos`}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Archivos
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/pacientes/${id}/consentimientos`}>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Consentimientos
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/pacientes/${id}/seguimiento`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Seguimiento
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/pacientes/${id}/evolucion`}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Evolución
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/pacientes/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{patient._count.measurements}</p>
                                <p className="text-xs text-muted-foreground">Mediciones</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{patient._count.appointments}</p>
                                <p className="text-xs text-muted-foreground">Turnos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{patient._count.nutritionPlans}</p>
                                <p className="text-xs text-muted-foreground">Planes alimentarios</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{patient._count.followUps}</p>
                                <p className="text-xs text-muted-foreground">Seguimientos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <FolderOpen className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{patient._count.files}</p>
                                <p className="text-xs text-muted-foreground">Archivos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{patient._count.consents}</p>
                                <p className="text-xs text-muted-foreground">Consentimientos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Datos personales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Nacimiento:</span>
                            <span>{formatDate(patient.birthDate)}</span>
                        </div>
                        {patient.documentNumber && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">DNI:</span>
                                <span>{patient.documentNumber}</span>
                            </div>
                        )}
                        {patient.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.email}</span>
                            </div>
                        )}
                        {patient.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.phone}</span>
                            </div>
                        )}
                        {patient.address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {patient.address}
                                    {patient.city ? `, ${patient.city}` : ""}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Información adicional</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {patient.occupation && (
                            <div>
                                <span className="text-muted-foreground">Ocupación: </span>
                                <span>{patient.occupation}</span>
                            </div>
                        )}
                        {patient.healthInsurance && (
                            <div>
                                <span className="text-muted-foreground">Obra social: </span>
                                <span>{patient.healthInsurance}</span>
                            </div>
                        )}
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

            {patient.allergies.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Alergias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {patient.allergies.map((a: any) => (
                                <Badge key={a.id} variant="destructive">
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
                    <CardHeader>
                        <CardTitle className="text-base">Medicación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
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
    );
}
