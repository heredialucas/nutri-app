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

    // ==================== DEMO PATIENT ====================
    console.log("🧪 Creating complete demo patient...");
    const demoPassword = await bcrypt.hash("12345678", 10);
    const demoUser = await prisma.user.upsert({
        where: { email: "paciente.demo@mauroacosta.com" },
        update: { password: demoPassword, isActive: true },
        create: {
            email: "paciente.demo@mauroacosta.com",
            username: "pacientedemo",
            password: demoPassword,
            firstName: "Valentina",
            lastName: "Gómez",
            fullName: "Valentina Gómez",
            isActive: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: demoUser.id, roleId: patientRole.id } },
        update: {},
        create: { userId: demoUser.id, roleId: patientRole.id },
    });

    const demoPatient = await prisma.patient.upsert({
        where: { userId: demoUser.id },
        update: { firstName: "Valentina", lastName: "Gómez", deletedAt: null },
        create: {
            userId: demoUser.id,
            firstName: "Valentina",
            lastName: "Gómez",
            email: "paciente.demo@mauroacosta.com",
            phone: "+54 9 381 555-0101",
            birthDate: new Date("1992-04-18"),
            gender: "FEMALE",
            documentNumber: "32123456",
            address: "Av. Aconquija 1450",
            city: "San Miguel de Tucumán",
            occupation: "Diseñadora gráfica",
            emergencyContact: "Mariana Gómez",
            emergencyPhone: "+54 9 381 555-0102",
            healthInsurance: "OSDE",
            billingType: "particular",
            status: "ACTIVE",
            notes: "Paciente demo para verificar todas las vistas, reportes y exportaciones.",
        },
    });

    await prisma.medicalHistory.upsert({
        where: { patientId: demoPatient.id },
        update: {},
        create: {
            patientId: demoPatient.id,
            familyHistory: "Madre con hipotiroidismo controlado.",
            personalHistory: "Sin cirugías previas. Controles clínicos anuales.",
            surgeries: "Niega.",
            diagnoses: "Sin diagnósticos relevantes informados.",
            habits: "No fuma. Consume alcohol ocasionalmente.",
            sleepHours: "7 horas promedio",
            physicalActivity: "Entrenamiento de fuerza 3 veces por semana y caminatas.",
            digestiveSymptoms: "Distensión ocasional luego de comidas abundantes.",
            observations: "Objetivo principal: mejorar composición corporal y organización alimentaria.",
        },
    });
    await prisma.allergy.create({ data: { patientId: demoPatient.id, name: "Lactosa", reaction: "Distensión abdominal", severity: "LEVE", notes: "Tolera yogur y quesos duros." } });
    await prisma.medication.create({ data: { patientId: demoPatient.id, name: "Levotiroxina", dosage: "50 mcg", frequency: "Una vez al día", indication: "Control endocrinológico", startDate: new Date("2021-03-01"), notes: "Según indicación médica." } });
    await prisma.patientGoal.createMany({ data: [
        { patientId: demoPatient.id, type: "COMPOSICIÓN CORPORAL", description: "Reducir gradualmente el porcentaje de masa adiposa", targetValue: "-3 puntos porcentuales", targetDate: new Date("2026-12-15") },
        { patientId: demoPatient.id, type: "HÁBITOS", description: "Sostener cuatro comidas planificadas", targetValue: "5 días por semana", targetDate: new Date("2026-10-01") },
    ] });

    const dates = [new Date("2026-08-01"), new Date("2026-08-29")];
    await prisma.isakAssessment.createMany({ data: [
        { patientId: demoPatient.id, measuredById: adminUser.id, measuredAt: dates[0], activityLevel: "MODERATE", sport: "Fuerza", weight: 68.4, height: 165, tricepsSF: 18, subscapSF: 16, suprailiacSF: 20, abdominalSF: 22, thighSF: 25, calfSF: 18, relaxedArm: 28.5, flexedArm: 30.2, waist: 78, hip: 101, midThigh: 55, calf: 36, humerusBreadth: 62, biStyloidWrist: 52, femurBreadth: 91, notes: "Evaluación inicial completa." },
        { patientId: demoPatient.id, measuredById: adminUser.id, measuredAt: dates[1], activityLevel: "MODERATE", sport: "Fuerza", weight: 67.1, height: 165, tricepsSF: 16, subscapSF: 15, suprailiacSF: 18, abdominalSF: 20, thighSF: 23, calfSF: 17, relaxedArm: 28.8, flexedArm: 30.6, waist: 75, hip: 100, midThigh: 54, calf: 36, humerusBreadth: 62, biStyloidWrist: 52, femurBreadth: 91, notes: "Evolución favorable del primer control." },
    ] });
    await prisma.anthropometricMeasurement.createMany({ data: [
        { patientId: demoPatient.id, measuredById: adminUser.id, measuredAt: dates[0], weight: 68.4, height: 165, bmi: 25.1, waist: 78, hip: 101, arm: 28.5, bodyFatPercentage: 29.4, muscleMass: 24.1, notes: "Registro inicial." },
        { patientId: demoPatient.id, measuredById: adminUser.id, measuredAt: dates[1], weight: 67.1, height: 165, bmi: 24.6, waist: 75, hip: 100, arm: 28.8, bodyFatPercentage: 27.8, muscleMass: 24.5, notes: "Segundo control." },
    ] });

    const plan = await prisma.nutritionPlan.create({ data: {
        professionalId: adminUser.id, title: "Plan equilibrado de Valentina", description: "Plan de ejemplo con opciones prácticas para días laborales y entrenamiento.", startDate: new Date("2026-08-29"), endDate: new Date("2026-09-28"), status: "ACTIVE", calorieTarget: 1850, proteinTarget: 120, carbTarget: 205, fatTarget: 62, notes: "Hidratación: 2 litros diarios. Ajustar por hambre, entrenamiento y evolución.", tips: "Priorizar verduras en almuerzo y cena. Preparar colaciones con anticipación.",
        patients: { create: { patientId: demoPatient.id } },
        days: { create: [
            { dayOrder: 1, label: "Día modelo", meals: { create: [
                { mealOrder: 1, label: "Desayuno", notes: "Comenzar con agua.", foods: { create: [{ name: "Avena", quantity: "40", unit: "g", calories: 150, protein: 5, carbs: 27, fat: 3 }, { name: "Yogur sin lactosa", quantity: "1", unit: "pote", calories: 120, protein: 10, carbs: 12, fat: 4 }, { name: "Frutillas", quantity: "1", unit: "taza", calories: 45, protein: 1, carbs: 11, fat: 0 }] } },
                { mealOrder: 2, label: "Almuerzo", foods: { create: [{ name: "Pechuga de pollo", quantity: "150", unit: "g", calories: 250, protein: 46, carbs: 0, fat: 6 }, { name: "Arroz integral cocido", quantity: "1", unit: "taza", calories: 215, protein: 5, carbs: 45, fat: 2 }, { name: "Ensalada de hojas y tomate", quantity: "2", unit: "tazas", calories: 70, protein: 3, carbs: 12, fat: 1 }] } },
                { mealOrder: 3, label: "Merienda", foods: { create: [{ name: "Manzana", quantity: "1", unit: "unidad", calories: 95, protein: 0, carbs: 25, fat: 0 }, { name: "Nueces", quantity: "15", unit: "g", calories: 100, protein: 2, carbs: 2, fat: 10 }] } },
                { mealOrder: 4, label: "Cena", foods: { create: [{ name: "Tortilla de vegetales", quantity: "1", unit: "porción", calories: 320, protein: 24, carbs: 18, fat: 17 }, { name: "Papa al horno", quantity: "180", unit: "g", calories: 165, protein: 4, carbs: 37, fat: 0 }] } },
            ] } },
            { dayOrder: 2, label: "Día de entrenamiento", meals: { create: [{ mealOrder: 1, label: "Pre-entrenamiento", foods: { create: [{ name: "Banana", quantity: "1", unit: "unidad", calories: 105, protein: 1, carbs: 27, fat: 0 }] } }, { mealOrder: 2, label: "Post-entrenamiento", foods: { create: [{ name: "Sándwich de atún", quantity: "1", unit: "unidad", calories: 380, protein: 28, carbs: 42, fat: 11 }] } }] } },
        ] },
        supplements: { create: [{ name: "Creatina monohidratada", dosage: "5 g", timing: "Diario", frequency: "Una vez al día", notes: "Consultar continuidad con el profesional." }] },
    } });
    const recipe = await prisma.recipe.create({ data: { professionalId: adminUser.id, nutritionPlanId: plan.id, title: "Bowl tibio de pollo y arroz", description: "Preparación completa para almuerzo o cena.", ingredients: "Pollo, arroz integral, tomate, hojas verdes, aceite de oliva.", instructions: "Cocinar el pollo y el arroz. Integrar con vegetales frescos y condimentar." } });
    const shoppingList = await prisma.shoppingList.create({ data: { patientId: demoPatient.id, nutritionPlanId: plan.id, title: "Compras semana 1", items: { create: [{ name: "Pechuga de pollo", quantity: "1", unit: "kg" }, { name: "Avena", quantity: "500", unit: "g" }, { name: "Frutas variadas", quantity: "2", unit: "kg" }, { name: "Verduras de estación", quantity: "1", unit: "bolsa" }] } } });
    await prisma.followUp.createMany({ data: [
        { patientId: demoPatient.id, weekStart: new Date("2026-08-24"), weight: 67.1, adherence: "ALTA", hunger: "Adecuada", energy: "Buena", difficulties: "Poco tiempo para cocinar el miércoles.", patientNotes: "Me resultó fácil sostener el desayuno.", proNotes: "Mantener preparaciones simples y planificar compras." },
        { patientId: demoPatient.id, weekStart: new Date("2026-08-17"), weight: 67.8, adherence: "MEDIA", hunger: "Variable", energy: "Buena", difficulties: "Cena fuera de casa.", patientNotes: "Necesito más opciones para comer afuera.", proNotes: "Enviar alternativas de restaurante." },
    ] });
    await prisma.progressPhoto.create({ data: { patientId: demoPatient.id, uploadedById: adminUser.id, url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId: "demo/progreso-valentina", type: "FRONT", takenAt: dates[1], consentGranted: true } });
    await prisma.patientFile.create({ data: { patientId: demoPatient.id, uploadedById: adminUser.id, name: "Laboratorio de ejemplo.pdf", url: "https://example.com/demo-laboratorio.pdf", publicId: "demo/laboratorio", mimeType: "application/pdf", size: 245760, category: "LABORATORIO" } });
    await prisma.consent.create({ data: { patientId: demoPatient.id, type: "TRATAMIENTO_NUTRICIONAL", version: "1.0", signedAt: dates[0], signature: "Valentina Gómez", ipAddress: "127.0.0.1", documentUrl: "https://example.com/demo-consentimiento.pdf" } });
    await prisma.payment.createMany({ data: [{ patientId: demoPatient.id, amount: 18000, method: "TRANSFERENCIA", description: "Consulta inicial", date: dates[0], notes: "Pago demo." }, { patientId: demoPatient.id, amount: 18000, method: "EFECTIVO", description: "Control mensual", date: dates[1] }] });
    await prisma.expense.create({ data: { category: "SERVICIOS", description: "Material de evaluación demo", amount: 2500, date: dates[0], notes: "Gasto de prueba para reportes." } });
    await prisma.availability.createMany({ data: [{ professionalId: adminUser.id, weekday: 1, startTime: "09:00", endTime: "13:00", slotDuration: 60 }, { professionalId: adminUser.id, weekday: 3, startTime: "15:00", endTime: "19:00", slotDuration: 60 }] });
    await prisma.appointment.createMany({ data: [{ patientId: demoPatient.id, professionalId: adminUser.id, type: "IN_PERSON", status: "COMPLETED", startAt: new Date("2026-08-29T10:00:00"), endAt: new Date("2026-08-29T11:00:00"), location: "Consultorio Mauro Acosta", notes: "Control antropométrico." }, { patientId: demoPatient.id, professionalId: adminUser.id, type: "ONLINE", status: "CONFIRMED", startAt: new Date("2026-09-12T11:00:00"), endAt: new Date("2026-09-12T12:00:00"), meetingUrl: "https://meet.google.com/demo-mauro", notes: "Revisión del plan y seguimiento." }] });
    const thread = await prisma.messageThread.create({ data: { patientId: demoPatient.id } });
    await prisma.message.create({ data: { threadId: thread.id, authorId: adminUser.id, content: "Hola Valentina, ya está disponible tu plan de ejemplo. Nos vemos en el próximo control." } });

    console.log(`✅ Demo patient created: paciente.demo@mauroacosta.com / 12345678`);
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
