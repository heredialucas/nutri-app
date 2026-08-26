"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface AppointmentsReportProps {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    pending: number;
}

export function AppointmentsReport({ total, completed, cancelled, noShow, pending }: AppointmentsReportProps) {
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Turnos del mes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{completed}</p>
                            <p className="text-xs text-muted-foreground">Completados ({completionRate}%)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{cancelled}</p>
                            <p className="text-xs text-muted-foreground">Cancelados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{noShow}</p>
                            <p className="text-xs text-muted-foreground">Ausencias</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
