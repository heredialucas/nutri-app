-- AlterTable: add patient gender (ISAK needs biological sex for formulas)
ALTER TABLE "patients" ADD COLUMN "gender" TEXT;

-- CreateTable: ISAK anthropometric assessment (body composition - 5 components)
CREATE TABLE "isak_assessments" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "measuredById" UUID,
    "appointmentId" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activityLevel" TEXT,
    "sport" TEXT,
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "tricepsSF" DECIMAL(5,2),
    "subscapSF" DECIMAL(5,2),
    "suprailiacSF" DECIMAL(5,2),
    "abdominalSF" DECIMAL(5,2),
    "thighSF" DECIMAL(5,2),
    "calfSF" DECIMAL(5,2),
    "relaxedArm" DECIMAL(5,2),
    "flexedArm" DECIMAL(5,2),
    "waist" DECIMAL(5,2),
    "hip" DECIMAL(5,2),
    "midThigh" DECIMAL(5,2),
    "calf" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "isak_assessments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "isak_assessments" ADD CONSTRAINT "isak_assessments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isak_assessments" ADD CONSTRAINT "isak_assessments_measuredById_fkey" FOREIGN KEY ("measuredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
