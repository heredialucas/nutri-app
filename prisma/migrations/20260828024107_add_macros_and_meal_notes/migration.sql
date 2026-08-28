-- AlterTable
ALTER TABLE "meal_foods" ADD COLUMN "calories" INTEGER;
ALTER TABLE "meal_foods" ADD COLUMN "protein" DECIMAL(5,2);
ALTER TABLE "meal_foods" ADD COLUMN "carbs" DECIMAL(5,2);
ALTER TABLE "meal_foods" ADD COLUMN "fat" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "meals" ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "nutrition_plans" ADD COLUMN "proteinTarget" INTEGER;
ALTER TABLE "nutrition_plans" ADD COLUMN "carbTarget" INTEGER;
ALTER TABLE "nutrition_plans" ADD COLUMN "fatTarget" INTEGER;
