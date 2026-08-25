import { getAllFollowUps } from "@/app/actions/followups";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ClipboardList, User } from "lucide-react";

export const metadata = {
    title: "Seguimientos",
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function adherenceColor(adherence: string | null) {
    if (!adherence) return "secondary";
    const val = parseInt(adherence);
    if (val >= 80) return "default";
    if (val >= 50) return "secondary";
    return "destructive";
}

export default async function SeguimientoPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const followUps = await getAllFollowUps();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Seguimientos</h1>
                <p className="text-muted-foreground text-sm">
                    Seguimientos semanales de tus pacientes
                </p>
            </div>

            {followUps.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No hay seguimientos registrados</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {followUps.map((fu: any) => (
                        <Link
                            key={fu.id}
                            href={`/dashboard/pacientes/${fu.patientId}`}
                            className="block"
                        >
                            <Card className="transition-colors hover:bg-accent/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {fu.patient.firstName} {fu.patient.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Semana del {formatDate(fu.weekStart)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {fu.weight && (
                                                <Badge variant="outline" className="text-xs">
                                                    {fu.weight} kg
                                                </Badge>
                                            )}
                                            {fu.adherence && (
                                                <Badge variant={adherenceColor(fu.adherence) as any} className="text-xs">
                                                    {fu.adherence}% cumplimiento
                                                </Badge>
                                            )}
                                            {fu.patient.status !== "ACTIVE" && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Archivado
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
