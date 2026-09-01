-- Remove the unused ISAK bone diameter fields from the initial schema.
ALTER TABLE "isak_assessments"
  DROP COLUMN "apAbdominalDepth",
  DROP COLUMN "apChestDepth",
  DROP COLUMN "biMalleolarAnkle",
  DROP COLUMN "biacromial",
  DROP COLUMN "biiliocristal",
  DROP COLUMN "transverseChest";
