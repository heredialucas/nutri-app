"use client";

import { useState, useEffect } from "react";
import { getAppointments, getAppointmentFormOptions } from "@/app/actions/appointments";
import { getBlockedDays } from "@/app/actions/blocked-days";
import { AppointmentFormDialog, type PatientOption, type LocationOption, type ProfessionalOption } from "@/components/appointments/appointment-form-dialog";
import { BlockDayDialog } from "@/components/appointments/block-day-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AR_TZ = "America/Argentina/Buenos_Aires";

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function toDateParam(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
    const [blockedDays, setBlockedDays] = useState<
        { id: string; date: string; reason: string | null }[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<{
        patients: PatientOption[];
        locations: LocationOption[];
        professional: ProfessionalOption;
    } | null>(null);
    const [newOpen, setNewOpen] = useState(false);
    const [newDate, setNewDate] = useState<string | undefined>(undefined);
    const [blockDialog, setBlockDialog] = useState<{ date: string; label: string } | null>(null);

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
            const firstDayStr = toDateParam(currentYear, currentMonth, 1);
            const lastDayStr = toDateParam(
                currentYear,
                currentMonth,
                getDaysInMonth(currentYear, currentMonth),
            );
            const [data, days] = await Promise.all([
                getAppointments({ from, to }),
                getBlockedDays(firstDayStr, lastDayStr).catch(() => []),
            ]);
            setAppointments(data as any);
            setBlockedDays(days as any);
        } catch {
            setAppointments([]);
            setBlockedDays([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMonth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonth, currentYear]);

    useEffect(() => {
        getAppointmentFormOptions()
            .then((data) => setOptions(data as any))
            .catch(() => setOptions(null));
    }, []);

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

    const openNewForDay = (day: number) => {
        setNewDate(toDateParam(currentYear, currentMonth, day));
        setNewOpen(true);
    };

    const openBlockDialog = (day: number) => {
        setBlockDialog({
            date: toDateParam(currentYear, currentMonth, day),
            label: format(new Date(currentYear, currentMonth, day), "EEEE d 'de' MMMM", {
                locale: es,
            }),
        });
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

    const blockedByDate: Record<string, { id: string; reason: string | null }> = {};
    blockedDays.forEach((b) => {
        blockedByDate[b.date] = { id: b.id, reason: b.reason };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
                    <p className="text-muted-foreground text-sm capitalize">{monthName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            setNewDate(todayArString());
                            setNewOpen(true);
                        }}
                        disabled={!options}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo turno
                    </Button>
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Usá el candado en un día para bloquearlo y evitar que se saquen turnos.
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
                    const dateStr = toDateParam(currentYear, currentMonth, day);
                    const blocked = blockedByDate[dateStr];
                    const isToday =
                        day === arToday.getDate() &&
                        currentMonth === arToday.getMonth() &&
                        currentYear === arToday.getFullYear();

                    return (
                        <div
                            key={day}
                            className={`p-2 min-h-[100px] ${
                                blocked
                                    ? "bg-muted/60 [background-image:repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_12px)]"
                                    : "bg-card"
                            } ${isToday ? "ring-2 ring-primary" : ""}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <p
                                    className={`text-xs font-medium ${
                                        isToday ? "text-primary" : ""
                                    } ${blocked ? "text-muted-foreground line-through" : ""}`}
                                >
                                    {day}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openBlockDialog(day)}
                                        className={
                                            blocked
                                                ? "text-destructive hover:text-destructive/80"
                                                : "text-muted-foreground hover:text-foreground"
                                        }
                                        title={blocked ? "Desbloquear día" : "Bloquear día"}
                                        aria-label={
                                            blocked
                                                ? `Desbloquear el ${day}`
                                                : `Bloquear el ${day}`
                                        }
                                    >
                                        <Lock className="h-3 w-3" />
                                    </button>
                                    {!blocked && (
                                        <button
                                            type="button"
                                            onClick={() => openNewForDay(day)}
                                            disabled={!options}
                                            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                                            aria-label={`Nuevo turno el ${day}`}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                {blocked && (
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Día bloqueado
                                    </p>
                                )}
                                {dayAppointments.slice(0, 3).map((a) => (
                                    <Link
                                        key={a.id}
                                        href={`/dashboard/turnos/${a.id}`}
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

            {options && (
                <AppointmentFormDialog
                    patients={options.patients}
                    locations={options.locations}
                    professional={options.professional}
                    defaultDate={newDate}
                    open={newOpen}
                    onOpenChange={setNewOpen}
                />
            )}

            {blockDialog && (
                <BlockDayDialog
                    date={blockDialog.date}
                    dateLabel={blockDialog.label}
                    blockedDay={blockedByDate[blockDialog.date] ?? null}
                    open={Boolean(blockDialog)}
                    onOpenChange={(o) => {
                        if (!o) setBlockDialog(null);
                    }}
                    onChanged={loadMonth}
                />
            )}
        </div>
    );
}

function todayArString() {
    const arNow = new Date(new Date().toLocaleString("en-US", { timeZone: AR_TZ }));
    return `${arNow.getFullYear()}-${String(arNow.getMonth() + 1).padStart(2, "0")}-${String(arNow.getDate()).padStart(2, "0")}`;
}
