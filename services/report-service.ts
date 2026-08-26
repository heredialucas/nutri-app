import prisma from "@/lib/prisma";

export const reportService = {
    async getDashboardSummary(professionalId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [activePatients, monthlyAppointments, monthlyPayments, monthlyExpenses] = await Promise.all([
            prisma.patient.count({ where: { status: "ACTIVE", deletedAt: null } }),
            prisma.appointment.count({
                where: {
                    professionalId,
                    startAt: { gte: startOfMonth, lte: endOfMonth },
                    status: { notIn: ["CANCELLED"] },
                },
            }),
            prisma.payment.aggregate({
                where: { date: { gte: startOfMonth, lte: endOfMonth } },
                _sum: { amount: true },
            }),
            prisma.expense.aggregate({
                where: { date: { gte: startOfMonth, lte: endOfMonth } },
                _sum: { amount: true },
            }),
        ]);

        return {
            activePatients,
            monthlyAppointments,
            monthlyIncome: Number(monthlyPayments._sum.amount ?? 0),
            monthlyExpenses: Number(monthlyExpenses._sum.amount ?? 0),
            monthlyProfit: Number(monthlyPayments._sum.amount ?? 0) - Number(monthlyExpenses._sum.amount ?? 0),
        };
    },

    async getPatientEvolution(patientId: string) {
        const [measurements, followUps, plans] = await Promise.all([
            prisma.anthropometricMeasurement.findMany({
                where: { patientId },
                orderBy: { measuredAt: "asc" },
            }),
            prisma.followUp.findMany({
                where: { patientId },
                orderBy: { weekStart: "asc" },
            }),
            prisma.nutritionPlan.findMany({
                where: { patientId },
                orderBy: { createdAt: "asc" },
            }),
        ]);

        return {
            measurements: measurements.map((m) => ({
                date: m.measuredAt,
                weight: m.weight ? Number(m.weight) : null,
                bmi: m.bmi ? Number(m.bmi) : null,
            })),
            followUps: followUps.map((f) => ({
                date: f.weekStart,
                weight: f.weight ? Number(f.weight) : null,
                adherence: f.adherence,
            })),
            plansCount: plans.length,
            activePlan: plans.find((p) => p.status === "ACTIVE") ?? null,
        };
    },

    async getMonthlyRevenue(months: number = 12) {
        const results: { month: string; income: number; expenses: number }[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const [payments, expenses] = await Promise.all([
                prisma.payment.aggregate({
                    where: { date: { gte: start, lte: end } },
                    _sum: { amount: true },
                }),
                prisma.expense.aggregate({
                    where: { date: { gte: start, lte: end } },
                    _sum: { amount: true },
                }),
            ]);

            results.push({
                month: start.toISOString().slice(0, 7),
                income: Number(payments._sum.amount ?? 0),
                expenses: Number(expenses._sum.amount ?? 0),
            });
        }

        return results;
    },

    async getPatientsSummary() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, active, archived, newThisMonth] = await Promise.all([
            prisma.patient.count({ where: { deletedAt: null } }),
            prisma.patient.count({ where: { status: "ACTIVE", deletedAt: null } }),
            prisma.patient.count({ where: { status: "ARCHIVED", deletedAt: null } }),
            prisma.patient.count({ where: { createdAt: { gte: startOfMonth } } }),
        ]);

        return { total, active, archived, newThisMonth };
    },

    async getAppointmentsSummary(professionalId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [total, completed, cancelled, noShow, pending] = await Promise.all([
            prisma.appointment.count({
                where: { professionalId, startAt: { gte: startOfMonth, lte: endOfMonth } },
            }),
            prisma.appointment.count({
                where: { professionalId, startAt: { gte: startOfMonth, lte: endOfMonth }, status: "COMPLETED" },
            }),
            prisma.appointment.count({
                where: { professionalId, startAt: { gte: startOfMonth, lte: endOfMonth }, status: "CANCELLED" },
            }),
            prisma.appointment.count({
                where: { professionalId, startAt: { gte: startOfMonth, lte: endOfMonth }, status: "NO_SHOW" },
            }),
            prisma.appointment.count({
                where: { professionalId, startAt: { gte: startOfMonth, lte: endOfMonth }, status: "PENDING" },
            }),
        ]);

        return { total, completed, cancelled, noShow, pending };
    },

    async getRetentionSummary() {
        const [totalPatients, activePatients, followUps] = await Promise.all([
            prisma.patient.count({ where: { deletedAt: null } }),
            prisma.patient.count({ where: { status: "ACTIVE", deletedAt: null } }),
            prisma.followUp.findMany({ select: { adherence: true } }),
        ]);

        const adherences = followUps
            .map((f) => (f.adherence ? parseInt(f.adherence) : null))
            .filter((a): a is number => a !== null);

        const averageAdherence = adherences.length > 0
            ? Math.round(adherences.reduce((sum, a) => sum + a, 0) / adherences.length)
            : null;

        return { totalPatients, activePatients, averageAdherence, followUpCount: followUps.length };
    },
};
