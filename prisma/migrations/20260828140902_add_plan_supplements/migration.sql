-- CreateTable
CREATE TABLE "plan_supplements" (
    "id" UUID NOT NULL,
    "nutritionPlanId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "timing" TEXT,
    "frequency" TEXT,
    "notes" TEXT,

    CONSTRAINT "plan_supplements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plan_supplements" ADD CONSTRAINT "plan_supplements_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
