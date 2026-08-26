"use server";

import { getCurrentUser, isPatientUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getCurrentPatientData() {
    const user = await getCurrentUser();
    if (!user || !isPatientUser(user)) return null;

    const patient = await prisma.patient.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            birthDate: true,
            billingType: true,
        },
    });

    if (!patient) return null;

    return {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || "",
        phone: patient.phone || "",
        birthDate: patient.birthDate
            ? patient.birthDate.toISOString().split("T")[0]
            : "",
        billingType: patient.billingType,
    };
}
