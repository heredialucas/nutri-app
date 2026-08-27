-- AlterTable
ALTER TABLE "nutrition_plans" ADD COLUMN "tips" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "nutritionPlanId" UUID;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "nutrition_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
