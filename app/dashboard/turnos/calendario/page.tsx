"use client";

import { useState, useEffect } from "react";
import { getAppointments } from "@/app/actions/appointments";
import { AppointmentStatusBadge, AppointmentTypeBadge } from "@/components/appointments/appointment-status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(() => {
        const arNow = new Date(now.toLocaleString("en-US", { timeZone: AR_TZ }));
        return arNow.getMonth();
    });
    const [currentYear, setCurrentYear] = useState(() => {
        const arNow = new Date(now.toLocaleString("en-US", { timeZone: AR_TZ }));
        return arNow.getFullYear();
    });
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const monthName = formatInTimeZone(
        new Date(Date.UTC(currentYear, currentMonth, 15)),
        AR_TZ,
        "LLLL yyyy",
        { locale: es },
    );

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const loadMonth = async () => {
        setLoading(true);
        try {
            // Query the full AR month range converted to UTC
            const fromLocal = new Date(currentYear, currentMonth, 1, 0, 0, 0);
            const toLocal = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
            const from = fromZonedTime(fromLocal, AR_TZ).toISOString();
            const to = fromZonedTime(toLocal, AR_TZ).toISOString();
            const data = await getAppointments({ from, to });
            setAppointments(data as any);
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMonth();
    }, [currentMonth, currentYear]);

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Group appointments by AR day
    const arToday = new Date(now.toLocaleString("en-US", { timeZone: AR_TZ }));
    const appointmentsByDay: Record<number, any[]> = {};
    appointments
        .filter((a) => a.status !== "CANCELLED")
        .forEach((a) => {
            const day = Number(formatInTimeZone(new Date(a.startAt), AR_TZ, "d"));
            if (!appointmentsByDay[day]) appointmentsByDay[day] = [];
            appointmentsByDay[day].push(a);
        });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
                    <p className="text-muted-foreground text-sm capitalize">{monthName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                    <div key={d} className="bg-card p-2 text-center text-xs font-medium text-muted-foreground">
                        {d}
                    </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background p-2 min-h-[100px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayAppointments = appointmentsByDay[day] || [];
                    const isToday =
                        day === arToday.getDate() &&
                        currentMonth === arToday.getMonth() &&
                        currentYear === arToday.getFullYear();

                    return (
                        <div
                            key={day}
                            className={`bg-card p-2 min-h-[100px] ${isToday ? "ring-2 ring-primary" : ""}`}
                        >
                            <p className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                                {day}
                            </p>
                            <div className="space-y-1">
                                {dayAppointments.slice(0, 3).map((a) => (
                                    <Link
                                        key={a.id}
                                        href={`/dashboard/pacientes/${a.patient.id}`}
                                        className="block text-[10px] rounded px-1 py-0.5 bg-primary/10 hover:bg-primary/20 truncate"
                                    >
                                        {formatInTimeZone(new Date(a.startAt), AR_TZ, "HH:mm")}{" "}
                                        {a.patient.firstName}
                                    </Link>
                                ))}
                                {dayAppointments.length > 3 && (
                                    <p className="text-[10px] text-muted-foreground">
                                        +{dayAppointments.length - 3} más
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
