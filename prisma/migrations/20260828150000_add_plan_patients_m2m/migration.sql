-- Crear tabla join para asignar un plan a muchos pacientes
CREATE TABLE "nutrition_plan_patients" (
    "planId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nutrition_plan_patients_pkey" PRIMARY KEY ("planId","patientId")
);

-- Migrar las asignaciones existentes (no hay planes actualmente; queda preparado para datos previos)
INSERT INTO "nutrition_plan_patients" ("planId", "patientId")
SELECT id, "patientId" FROM "nutrition_plans" WHERE "patientId" IS NOT NULL;

-- Foreign keys
ALTER TABLE "nutrition_plan_patients" ADD CONSTRAINT "nutrition_plan_patients_planId_fkey" FOREIGN KEY ("planId") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nutrition_plan_patients" ADD CONSTRAINT "nutrition_plan_patients_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Eliminar la FK antigua y la columna patientId (un plan ya no tiene un único paciente)
ALTER TABLE "nutrition_plans" DROP CONSTRAINT "nutrition_plans_patientId_fkey";
ALTER TABLE "nutrition_plans" DROP COLUMN "patientId";
