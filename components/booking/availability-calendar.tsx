"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { getPublicMonthAvailability } from "@/app/actions/public-booking";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
    locationId: string;
    dni?: string;
    email?: string;
    selectedDate: string;
    onSelectDate: (date: string) => void;
    className?: string;
}

function parseDateOnly(value: string): Date {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function toDateKey(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

export default function AvailabilityCalendar({
    locationId,
    dni,
    email,
    selectedDate,
    onSelectDate,
    className,
}: AvailabilityCalendarProps) {
    const [month, setMonth] = useState<Date>(() => parseDateOnly(selectedDate));
    const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!locationId) {
            setAvailableDays(new Set());
            return;
        }

        let active = true;
        setLoading(true);

        getPublicMonthAvailability({
            month: format(month, "yyyy-MM"),
            locationId,
            dni,
            email,
        })
            .then((days) => {
                if (active) setAvailableDays(new Set(days));
            })
            .catch(() => {
                if (active) setAvailableDays(new Set());
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [month, locationId, dni, email]);

    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const isAvailable = (day: Date) => availableDays.has(toDateKey(day));

    const selected = selectedDate ? parseDateOnly(selectedDate) : undefined;

    return (
        <div
            className={cn(
                "rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-2",
                className,
            )}
        >
            <Calendar
                mode="single"
                locale={es}
                weekStartsOn={1}
                month={month}
                onMonthChange={setMonth}
                selected={selected}
                onSelect={(day) => {
                    if (day && isAvailable(day)) onSelectDate(toDateKey(day));
                }}
                disabled={(day) => day < today || !isAvailable(day)}
                components={{
                    DayButton: (props) => (
                        <CalendarDayButton
                            {...props}
                            className={cn(
                                props.modifiers.available &&
                                    !props.modifiers.selected &&
                                    "border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800",
                                props.className,
                            )}
                        />
                    ),
                }}
                className="mx-auto"
            />

            <div className="mt-1 flex items-center justify-between gap-2 border-t border-[rgba(0,0,0,0.05)] px-2 pt-2 pb-1">
                <div className="flex items-center gap-1.5 text-xs text-[#666]">
                    <span className="inline-block size-3 rounded-[3px] border border-green-300 bg-green-50" />
                    Días con turnos disponibles
                </div>
                {loading && <Loader2 size={13} className="animate-spin text-[#999]" />}
            </div>
        </div>
    );
}
