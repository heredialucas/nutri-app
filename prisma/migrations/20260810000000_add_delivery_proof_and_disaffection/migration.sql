-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN "deliveredById" UUID,
ADD COLUMN "deliveryProofUrl" TEXT,
ADD COLUMN "disaffectionReviewed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "delivery_items" ADD COLUMN "disaffectedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
