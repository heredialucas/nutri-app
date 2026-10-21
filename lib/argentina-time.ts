import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const AR_TZ = "America/Argentina/Buenos_Aires";

export function getArgentinaDateKey(date = new Date()): string {
    return formatInTimeZone(date, AR_TZ, "yyyy-MM-dd");
}

export function addCalendarDays(dateKey: string, amount: number): string {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + amount))
        .toISOString()
        .slice(0, 10);
}

export function getArgentinaDayRange(dateKey: string) {
    const nextDateKey = addCalendarDays(dateKey, 1);

    return {
        startAt: fromZonedTime(`${dateKey}T00:00:00`, AR_TZ),
        endAt: fromZonedTime(`${nextDateKey}T00:00:00`, AR_TZ),
    };
}

export function getArgentinaIsoWeekday(date = new Date()): number {
    return Number(formatInTimeZone(date, AR_TZ, "i"));
}

/** `weekStart` is stored as a date-only value represented by UTC midnight. */
export function getArgentinaWeekStartDate(date = new Date()): Date {
    const mondayKey = addCalendarDays(
        getArgentinaDateKey(date),
        1 - getArgentinaIsoWeekday(date),
    );

    return new Date(`${mondayKey}T00:00:00.000Z`);
}

export function getArgentinaDayOfYear(date = new Date()): number {
    const [year, month, day] = getArgentinaDateKey(date)
        .split("-")
        .map(Number);
    const current = Date.UTC(year, month - 1, day);
    const firstDay = Date.UTC(year, 0, 1);

    return Math.floor((current - firstDay) / 86_400_000) + 1;
}

export function formatArgentinaWeekday(date: Date): string {
    const weekday = formatInTimeZone(date, AR_TZ, "EEEE", { locale: es });
    return weekday.charAt(0).toLocaleUpperCase("es-AR") + weekday.slice(1);
}
