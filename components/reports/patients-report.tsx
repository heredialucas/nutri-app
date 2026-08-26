"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, UserX } from "lucide-react";

interface PatientsReportProps {
    total: number;
    active: number;
    archived: number;
    newThisMonth: number;
}

export function PatientsReport({ total, active, archived, newThisMonth }: PatientsReportProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pacientes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{active}</p>
                            <p className="text-xs text-muted-foreground">Activos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserX className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-600">{archived}</p>
                            <p className="text-xs text-muted-foreground">Archivados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{newThisMonth}</p>
                            <p className="text-xs text-muted-foreground">Nuevos este mes</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
