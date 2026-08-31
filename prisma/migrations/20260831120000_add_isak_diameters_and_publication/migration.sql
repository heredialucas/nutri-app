-- ISAK diameters are stored in millimetres.
ALTER TABLE "isak_assessments"
  ADD COLUMN "humerusBreadth" DECIMAL(6,2),
  ADD COLUMN "femurBreadth" DECIMAL(6,2),
  ADD COLUMN "biStyloidWrist" DECIMAL(6,2),
  ADD COLUMN "biMalleolarAnkle" DECIMAL(6,2),
  ADD COLUMN "biacromial" DECIMAL(6,2),
  ADD COLUMN "biiliocristal" DECIMAL(6,2),
  ADD COLUMN "transverseChest" DECIMAL(6,2),
  ADD COLUMN "apChestDepth" DECIMAL(6,2),
  ADD COLUMN "apAbdominalDepth" DECIMAL(6,2),
  ADD COLUMN "publishedToPatientAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" UUID;

ALTER TABLE "isak_assessments"
  ADD CONSTRAINT "isak_assessments_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
