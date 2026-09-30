import prisma from "@/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

function toDbDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00.000Z`);
}

function fromDbDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

export const blockedDayService = {
    async listByRange(professionalId: string, from: string, to: string) {
        const rows = await prisma.blockedDay.findMany({
            where: {
                professionalId,
                date: { gte: toDbDate(from), lte: toDbDate(to) },
            },
            orderBy: { date: "asc" },
        });
        return rows.map((row) => ({ ...row, date: fromDbDate(row.date) }));
    },

    async create(data: { professionalId: string; date: string; reason?: string | null }) {
        const date = toDbDate(data.date);

        const existing = await prisma.blockedDay.findUnique({
            where: { professionalId_date: { professionalId: data.professionalId, date } },
        });
        if (existing) throw new Error("Ese día ya está bloqueado");

        const row = await prisma.blockedDay.create({
            data: {
                professionalId: data.professionalId,
                date,
                reason: data.reason?.trim() || null,
            },
        });
        return { ...row, date: fromDbDate(row.date) };
    },

    async delete(id: string) {
        return prisma.blockedDay.delete({ where: { id } });
    },

    async isBlocked(professionalId: string, date: Date) {
        const dateStr = formatInTimeZone(date, AR_TZ, "yyyy-MM-dd");
        const row = await prisma.blockedDay.findUnique({
            where: { professionalId_date: { professionalId, date: toDbDate(dateStr) } },
            select: { id: true },
        });
        return Boolean(row);
    },
};
