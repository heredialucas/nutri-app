-- AlterTable
ALTER TABLE "users" ADD COLUMN "must_set_password" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_verification_codes" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "userId" UUID,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_codes_email_createdAt_idx" ON "email_verification_codes"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "email_verification_codes"
  ADD CONSTRAINT "email_verification_codes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
