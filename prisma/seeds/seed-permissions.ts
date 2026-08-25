import prisma from "@/lib/prisma";

export async function seedPermissions() {
    const permissions = [
        { action: "dashboard:view", description: "Ver panel principal" },

        { action: "patients:read", description: "Ver lista de pacientes" },
        { action: "patients:create", description: "Crear pacientes" },
        { action: "patients:update", description: "Editar pacientes" },
        { action: "patients:delete", description: "Archivar pacientes" },

        { action: "medical_history:read", description: "Ver historia clínica" },
        { action: "medical_history:update", description: "Editar historia clínica, alergias, medicación y objetivos" },

        { action: "appointments:read", description: "Ver turnos y agenda" },
        { action: "appointments:create", description: "Crear turnos" },
        { action: "appointments:update", description: "Confirmar, cancelar y reprogramar turnos" },

        { action: "availability:read", description: "Ver disponibilidad horaria" },
        { action: "availability:manage", description: "Configurar disponibilidad horaria" },

        { action: "measurements:read", description: "Ver mediciones antropométricas" },
        { action: "measurements:create", description: "Cargar mediciones" },
        { action: "measurements:update", description: "Editar mediciones" },
        { action: "measurements:delete", description: "Eliminar mediciones" },

        { action: "plans:read", description: "Ver planes alimentarios" },
        { action: "plans:create", description: "Crear planes alimentarios" },
        { action: "plans:update", description: "Editar planes alimentarios" },
        { action: "plans:delete", description: "Eliminar planes alimentarios" },

        { action: "recipes:read", description: "Ver recetas" },
        { action: "recipes:create", description: "Crear recetas" },
        { action: "recipes:update", description: "Editar recetas" },
        { action: "recipes:delete", description: "Eliminar recetas" },

        { action: "followups:read", description: "Ver seguimientos semanales" },
        { action: "followups:create", description: "Crear seguimientos" },
        { action: "followups:update", description: "Responder seguimientos" },
        { action: "followups:delete", description: "Eliminar seguimientos" },

        { action: "files:read", description: "Ver archivos de pacientes" },
        { action: "files:manage", description: "Subir y eliminar archivos" },

        { action: "consents:read", description: "Ver consentimientos" },
        { action: "consents:update", description: "Registrar consentimientos" },

        { action: "payments:read", description: "Ver cobros" },
        { action: "payments:create", description: "Registrar cobros" },
        { action: "payments:update", description: "Editar cobros" },
        { action: "payments:delete", description: "Eliminar cobros" },

        { action: "expenses:read", description: "Ver gastos" },
        { action: "expenses:create", description: "Registrar gastos" },
        { action: "expenses:update", description: "Editar gastos" },
        { action: "expenses:delete", description: "Eliminar gastos" },

        { action: "reports:read", description: "Ver reportes y estadísticas" },

        { action: "messages:read", description: "Ver mensajes de pacientes" },
        { action: "messages:send", description: "Enviar y gestionar mensajes" },

        { action: "users:read", description: "Ver usuarios del sistema" },
        { action: "users:manage", description: "Gestionar usuarios, roles y permisos" },

        { action: "settings:manage", description: "Configurar datos del consultorio" },
    ];

    console.log("🔐 Seeding permissions...");

    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { action: permission.action },
            update: { description: permission.description },
            create: permission,
        });
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);
}
