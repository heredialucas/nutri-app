import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seeding...");

    // ==================== PERMISSIONS ====================
    console.log("🔐 Seeding permissions...");

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

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { action: perm.action },
            update: { description: perm.description },
            create: perm,
        });
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);

    // ==================== ROLES ====================
    console.log("👥 Seeding roles...");

    const adminRole = await prisma.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: { name: "ADMIN", description: "Administrador con acceso total" },
    });

    const professionalRole = await prisma.role.upsert({
        where: { name: "PROFESSIONAL" },
        update: {},
        create: { name: "PROFESSIONAL", description: "Profesional nutricional: pacientes, turnos, historia clínica, planes y seguimiento" },
    });

    const assistantRole = await prisma.role.upsert({
        where: { name: "ASSISTANT" },
        update: {},
        create: { name: "ASSISTANT", description: "Asistente: pacientes y agenda con acceso clínico limitado" },
    });

    const receptionRole = await prisma.role.upsert({
        where: { name: "RECEPTION" },
        update: {},
        create: { name: "RECEPTION", description: "Recepción: turnos, datos básicos y cobros" },
    });

    const patientRole = await prisma.role.upsert({
        where: { name: "PATIENT" },
        update: {},
        create: { name: "PATIENT", description: "Paciente: únicamente sus propios datos" },
    });

    console.log("✅ Seeded roles: ADMIN, PROFESSIONAL, ASSISTANT, RECEPTION, PATIENT");

    // ==================== ASSIGN PERMISSIONS ====================
    console.log("🔗 Assigning permissions to roles...");

    const allPermissions = await prisma.permission.findMany();

    const assignPermissions = async (roleId: string, actions: string[]) => {
        const permsToAssign = allPermissions.filter(p => actions.includes(p.action));
        for (const p of permsToAssign) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId, permissionId: p.id } },
                update: {},
                create: { roleId, permissionId: p.id }
            });
        }
    };

    // ADMIN: all permissions
    for (const p of allPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
            update: {},
            create: { roleId: adminRole.id, permissionId: p.id }
        });
    }

    // PROFESSIONAL: patients, history, appointments, measurements, plans, recipes, follow-ups, files, messages
    const professionalActions = [
        "dashboard:view",
        "patients:read", "patients:create", "patients:update", "patients:delete",
        "medical_history:read", "medical_history:update",
        "appointments:read", "appointments:create", "appointments:update",
        "availability:read", "availability:manage",
        "measurements:read", "measurements:create", "measurements:update", "measurements:delete",
        "plans:read", "plans:create", "plans:update", "plans:delete",
        "recipes:read", "recipes:create", "recipes:update", "recipes:delete",
        "followups:read", "followups:create", "followups:update", "followups:delete",
        "files:read", "files:manage",
        "consents:read", "consents:update",
        "payments:read",
        "reports:read",
        "messages:read", "messages:send",
    ];
    await assignPermissions(professionalRole.id, professionalActions);

    // ASSISTANT: patients, appointments, limited clinical (view only)
    const assistantActions = [
        "dashboard:view",
        "patients:read", "patients:create", "patients:update",
        "medical_history:read",
        "appointments:read", "appointments:create", "appointments:update",
        "measurements:read",
        "plans:read",
        "followups:read",
        "files:read", "files:manage",
        "consents:read",
        "messages:read",
    ];
    await assignPermissions(assistantRole.id, assistantActions);

    // RECEPTION: appointments, basic data, payments
    const receptionActions = [
        "dashboard:view",
        "patients:read", "patients:create", "patients:update",
        "appointments:read", "appointments:create", "appointments:update",
        "payments:read", "payments:create", "payments:update",
        "consents:read",
    ];
    await assignPermissions(receptionRole.id, receptionActions);

    // PATIENT: dashboard only (patient portal will be added later)
    const patientActions = [
        "dashboard:view",
    ];
    await assignPermissions(patientRole.id, patientActions);

    console.log("✅ Assigned permissions to roles");

    // ==================== CREATE ADMIN USER ====================
    console.log("👤 Creating admin user...");

    const adminPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await prisma.user.upsert({
        where: { email: "admin@mauroacosta.com" },
        update: { password: adminPassword },
        create: {
            email: "admin@mauroacosta.com",
            username: "admin",
            password: adminPassword,
            firstName: "Mauro",
            lastName: "Acosta",
            fullName: "Mauro Acosta",
            isActive: true,
        },
    });

    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRole.id },
    });

    console.log(`✅ Admin user created: admin@mauroacosta.com`);
    console.log("🌱 Database seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
