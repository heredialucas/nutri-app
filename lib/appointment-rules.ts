export const FIRST_CONSULTATION_DURATION_MINUTES = 45;
export const DEFAULT_SLOT_DURATION = 30;

export const FIRST_APPOINTMENT_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "RESCHEDULED",
] as const;

export function getEffectiveDurationMinutes(
    baseSlotDuration: number,
    isFirstAppointment: boolean,
): number {
    const base = Number.isFinite(baseSlotDuration) && baseSlotDuration > 0
        ? Math.round(baseSlotDuration)
        : DEFAULT_SLOT_DURATION;

    return isFirstAppointment ? Math.max(FIRST_CONSULTATION_DURATION_MINUTES, base) : base;
}

export function minutesBetween(startAt: Date, endAt: Date): number {
    return Math.round((endAt.getTime() - startAt.getTime()) / 60000);
}
