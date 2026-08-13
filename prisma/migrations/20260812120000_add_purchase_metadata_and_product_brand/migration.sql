-- AlterTable
ALTER TABLE "products" ADD COLUMN     "brand" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "causative" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "responsible" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subject" TEXT NOT NULL DEFAULT '';
