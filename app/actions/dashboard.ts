"use server";

import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { appointmentService } from "@/services/appointment-service";
import { patientService } from "@/services/patient-service";
import { reportService } from "@/services/report-service";
import prisma from "@/lib/prisma";

export async function getDashboardSummary() {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (isPatientUser(user)) throw new Error("Acceso no autorizado");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [summary, todayAppointments, upcomingCount, pendingFollowUps] = await Promise.all([
        reportService.getDashboardSummary(user.id),
        appointmentService.getTodayAppointments(user.id),
        appointmentService.getUpcomingCount(user.id),
        prisma.followUp.findMany({
            where: {
                patient: { status: "ACTIVE", deletedAt: null },
            },
            orderBy: { weekStart: "desc" },
            take: 100,
            select: { patientId: true, weekStart: true },
        }),
    ]);

    // Calcular pacientes sin seguimiento reciente (últimos 14 días)
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const patientsWithRecentFollowUp = new Set(
        pendingFollowUps
            .filter((f) => new Date(f.weekStart) >= twoWeeksAgo)
            .map((f) => f.patientId)
    );

    const allActivePatients = await prisma.patient.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
    });

    const patientsNeedingFollowUp = allActivePatients
        .filter((p) => !patientsWithRecentFollowUp.has(p.id))
        .slice(0, 5);

    return {
        ...summary,
        todayAppointments: todayAppointments.map((a) => ({
            id: a.id,
            startAt: a.startAt.toISOString(),
            endAt: a.endAt.toISOString(),
            type: a.type,
            status: a.status,
            patient: {
                id: a.patient.id,
                firstName: a.patient.firstName,
                lastName: a.patient.lastName,
            },
        })),
        upcomingCount,
        patientsNeedingFollowUp,
    };
}
