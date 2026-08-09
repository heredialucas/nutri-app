-- AlterEnum
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'PARTIALLY_RECEIVED';

-- AlterTable
ALTER TABLE "purchase_receipt_items" ADD COLUMN "purchaseOrderItemId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "purchase_receipt_items_receiptId_purchaseOrderItemId_key"
ON "purchase_receipt_items"("receiptId", "purchaseOrderItemId");

-- AddForeignKey
ALTER TABLE "purchase_receipt_items"
ADD CONSTRAINT "purchase_receipt_items_purchaseOrderItemId_fkey"
FOREIGN KEY ("purchaseOrderItemId") REFERENCES "purchase_order_items"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
