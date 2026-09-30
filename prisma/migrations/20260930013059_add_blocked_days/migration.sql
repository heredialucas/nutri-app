-- CreateTable
CREATE TABLE "blocked_days" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_days_date_idx" ON "blocked_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_days_professionalId_date_key" ON "blocked_days"("professionalId", "date");

-- AddForeignKey
ALTER TABLE "blocked_days" ADD CONSTRAINT "blocked_days_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
