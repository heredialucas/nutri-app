"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission, isPatientUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

export type AnamnesisInput = {
  consultationReason?: string; mainObjective?: string; mealsPerDay?: string; waterIntake?: string;
  breakfast?: string; lunch?: string; snack?: string; dinner?: string; snacksDrinks?: string;
  likedFoods?: string; dislikedFoods?: string; difficultFoods?: string; eatsOut?: boolean; eatsOutFrequency?: string;
  physicalActivity?: boolean; activityName?: string; activityDays?: string; activityDuration?: string; activitySchedule?: string; activityLevel?: string; sportsObjective?: string;
  sleepHours?: string; sleepQuality?: string; stressLevel?: string; energyLevel?: string; supplements?: string;
  digestiveSymptoms?: string; bowelFrequency?: string; digestiveNotes?: string; previousDiets?: boolean; adherenceDifficulty?: string; readinessScore?: number;
  treatmentGoal?: string; agreedGoal?: string; nextControl?: string; anthropometryMethod?: string; visceralFat?: string; professionalNotes?: string;
};

async function requireProfessional() {
  const user = await getCurrentUser();
  if (!user || isPatientUser(user) || !hasPermission(user, "patients:read")) throw new Error("No autorizado");
  return user;
}

export async function getPatientAnamnesis(patientId: string) {
  await requireProfessional();
  return serializePrisma(await prisma.patientAnamnesis.findUnique({ where: { patientId } }));
}

export async function savePatientAnamnesis(patientId: string, data: AnamnesisInput) {
  const user = await requireProfessional();
  const { nextControl, ...rest } = data;
  const result = await prisma.patientAnamnesis.upsert({
    where: { patientId },
    create: { patientId, ...rest, nextControl: nextControl ? new Date(nextControl) : undefined, completedBy: user.id, completedAt: new Date(), status: "REVIEWED", reviewedAt: new Date() },
    update: { ...rest, nextControl: nextControl ? new Date(nextControl) : null, completedBy: user.id, completedAt: new Date(), status: "REVIEWED", reviewedAt: new Date() },
  });
  revalidatePath(`/dashboard/pacientes/${patientId}/anamnesis`);
  revalidatePath(`/dashboard/pacientes/${patientId}`);
  return serializePrisma(result);
}
