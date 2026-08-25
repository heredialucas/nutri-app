import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, AlertTriangle } from "lucide-react";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
}

export function PatientAlerts({ patients }: { patients: Patient[] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    Pacientes sin seguimiento
                </CardTitle>
                <Link
                    href="/dashboard/pacientes"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                    Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent>
                {patients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Todos los pacientes tienen seguimiento reciente
                    </p>
                ) : (
                    <div className="space-y-2">
                        {patients.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium">
                                        {p.firstName} {p.lastName}
                                    </p>
                                </div>
                                <Badge variant="secondary">Sin seguimiento</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
