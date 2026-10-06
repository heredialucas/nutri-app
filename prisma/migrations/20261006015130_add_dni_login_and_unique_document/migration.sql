-- AlterTable
ALTER TABLE "users" ADD COLUMN "dni" TEXT;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_dni_key" ON "users"("dni");
CREATE UNIQUE INDEX "patients_documentNumber_key" ON "patients"("documentNumber");
