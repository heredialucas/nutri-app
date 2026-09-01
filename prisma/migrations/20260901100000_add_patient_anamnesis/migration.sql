CREATE TABLE "patient_anamneses" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "consultationReason" TEXT, "mainObjective" TEXT, "mealsPerDay" TEXT, "waterIntake" TEXT,
  "breakfast" TEXT, "lunch" TEXT, "snack" TEXT, "dinner" TEXT, "snacksDrinks" TEXT,
  "likedFoods" TEXT, "dislikedFoods" TEXT, "difficultFoods" TEXT, "eatsOut" BOOLEAN, "eatsOutFrequency" TEXT,
  "physicalActivity" BOOLEAN, "activityName" TEXT, "activityDays" TEXT, "activityDuration" TEXT, "activitySchedule" TEXT, "activityLevel" TEXT, "sportsObjective" TEXT,
  "sleepHours" TEXT, "sleepQuality" TEXT, "stressLevel" TEXT, "energyLevel" TEXT, "supplements" TEXT,
  "digestiveSymptoms" TEXT, "bowelFrequency" TEXT, "digestiveNotes" TEXT, "previousDiets" BOOLEAN, "adherenceDifficulty" TEXT, "readinessScore" INTEGER,
  "treatmentGoal" TEXT, "agreedGoal" TEXT, "nextControl" TIMESTAMP(3), "anthropometryMethod" TEXT, "visceralFat" TEXT, "professionalNotes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "completedBy" UUID, "completedAt" TIMESTAMP(3), "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patient_anamneses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "patient_anamneses_patientId_key" ON "patient_anamneses"("patientId");
ALTER TABLE "patient_anamneses" ADD CONSTRAINT "patient_anamneses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_anamneses" ADD CONSTRAINT "patient_anamneses_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
