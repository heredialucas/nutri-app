-- CreateTable
CREATE TABLE "whatsapp_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "encrypted_phone" TEXT NOT NULL,
    "encrypted_api_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notif_turnos_hoy" BOOLEAN NOT NULL DEFAULT true,
    "notif_turnos_manana" BOOLEAN NOT NULL DEFAULT true,
    "notif_seguimientos_pendientes" BOOLEAN NOT NULL DEFAULT true,
    "notif_pacientes_inactivos" BOOLEAN NOT NULL DEFAULT false,
    "notif_plan_del_dia" BOOLEAN NOT NULL DEFAULT true,
    "notif_turno_24h" BOOLEAN NOT NULL DEFAULT true,
    "notif_turno_2h" BOOLEAN NOT NULL DEFAULT true,
    "notif_tips_recetas" BOOLEAN NOT NULL DEFAULT false,
    "notif_seguimiento_semanal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_settings_user_id_key" ON "whatsapp_settings"("user_id");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_type_sent_at_idx" ON "notification_logs"("user_id", "type", "sent_at");

-- AddForeignKey
ALTER TABLE "whatsapp_settings" ADD CONSTRAINT "whatsapp_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
