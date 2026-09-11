-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "locationId" UUID;

-- AlterTable
ALTER TABLE "availability" ADD COLUMN "locationId" UUID;

-- CreateIndex
CREATE INDEX "appointments_locationId_idx" ON "appointments"("locationId");

-- CreateIndex
CREATE INDEX "availability_locationId_idx" ON "availability"("locationId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data backfill: sedes iniciales
-- IDs fijos para poder referenciarlos en el backfill. Editables luego desde el panel.
INSERT INTO "locations" ("id", "name", "address", "isActive", "createdAt", "updatedAt")
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Sede Centro', 'San Miguel de Tucumán, Tucumán', true, now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'Sede Yerba Buena', 'Yerba Buena, Tucumán', true, now(), now())
ON CONFLICT ("id") DO NOTHING;

-- Turnos presenciales existentes quedan asociados a la Sede Centro
UPDATE "appointments"
SET "locationId" = '00000000-0000-0000-0000-000000000001'
WHERE "type" = 'IN_PERSON' AND "locationId" IS NULL;

-- La disponibilidad existente pasa a interpretarse como Online (locationId NULL).
-- Se duplican los bloques para la Sede Centro para que la agenda presencial arranque con el mismo horario.
INSERT INTO "availability" ("id", "professionalId", "locationId", "weekday", "startTime", "endTime", "slotDuration", "isActive")
SELECT gen_random_uuid(), "professionalId", '00000000-0000-0000-0000-000000000001', "weekday", "startTime", "endTime", "slotDuration", "isActive"
FROM "availability"
WHERE "locationId" IS NULL;
