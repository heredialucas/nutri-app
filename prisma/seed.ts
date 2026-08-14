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

    // ==================== SEED PERMISSIONS ====================
    console.log("🔐 Seeding permissions...");

    const permissions = [
        // Inventory & Products
        { action: "inventory.manage", description: "Crear, editar y eliminar productos" },
        { action: "inventory.view", description: "Ver productos y niveles de stock" },

        // Categories
        { action: "categories.manage", description: "Crear, editar y eliminar categorías" },
        { action: "categories.view", description: "Ver categorías" },

        // Warehouses
        { action: "warehouses.manage", description: "Crear, editar y eliminar almacenes" },
        { action: "warehouses.view", description: "Ver almacenes y su stock" },

        // Transfers (Movements between warehouses)
        { action: "transfers.manage", description: "Crear, completar y cancelar transferencias entre almacenes" },
        { action: "transfers.view", description: "Ver transferencias entre almacenes" },

        // Loans (documented stock outflows)
        { action: "loans.manage", description: "Registrar y gestionar préstamos de materiales" },
        { action: "loans.view", description: "Ver préstamos de materiales" },

        // Traceability (General Movements)
        { action: "movements.view", description: "Ver historial completo de movimientos de stock" },

        // Purchases
        { action: "purchases.manage", description: "Crear, editar, recibir y cancelar órdenes de compra" },
        { action: "purchases.view", description: "Ver órdenes de compra" },

        // Deliveries
        { action: "deliveries.manage", description: "Crear, confirmar, entregar y cancelar entregas" },
        { action: "deliveries.view", description: "Ver entregas" },

        // Suppliers
        { action: "suppliers.manage", description: "Crear, editar y eliminar proveedores" },
        { action: "suppliers.view", description: "Ver proveedores" },

        // Institutions
        { action: "institutions.manage", description: "Crear, editar y eliminar instituciones" },
        { action: "institutions.view", description: "Ver instituciones" },

        // Reports & Analytics
        { action: "reports.view", description: "Ver todos los reportes y análisis" },

        // Users & Roles (Admin)
        { action: "users.manage", description: "Gestionar usuarios, roles y permisos" },
        { action: "users.view", description: "Ver usuarios" },

        // Expedientes
        { action: "expedientes.manage", description: "Gestionar expedientes" },
        { action: "expedientes.view", description: "Ver expedientes" },

        // Receipts
        { action: "receipts.manage", description: "Gestionar recibos de compra" },
        { action: "receipts.view", description: "Ver recibos de compra" },

        // Admin Products (Gestión de stock mínimo desde Administración)
        { action: "adminProducts.manage", description: "Gestionar productos: stock mínimo y configuración" },
        { action: "adminProducts.view", description: "Ver lista de productos en administración" },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { action: perm.action },
            update: { description: perm.description },
            create: perm,
        });
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);

    // ==================== CREATE ROLES ====================
    console.log("👥 Seeding roles...");

    const adminRole = await prisma.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: { name: "ADMIN", description: "Administrador con acceso total" },
    });

    const encargadoRole = await prisma.role.upsert({
        where: { name: "ENCARGADO" },
        update: {},
        create: { name: "ENCARGADO", description: "Encargado con acceso administrativo operativo" },
    });

    const comprasRole = await prisma.role.upsert({
        where: { name: "COMPRAS" },
        update: {},
        create: { name: "COMPRAS", description: "Personal del departamento de Compras" },
    });

    const depositoRole = await prisma.role.upsert({
        where: { name: "DEPOSITO" },
        update: {},
        create: { name: "DEPOSITO", description: "Personal del departamento de Depósito" },
    });

    const tecnicoRole = await prisma.role.upsert({
        where: { name: "TECNICO" },
        update: {},
        create: { name: "TECNICO", description: "Técnico con acceso solo a entregas" },
    });

    console.log("✅ Seeded roles: ADMIN, ENCARGADO, COMPRAS, DEPOSITO, TECNICO");

    console.log("✅ Seeded 4 roles");

    // ==================== ASSIGN PERMISSIONS TO ROLES ====================
    console.log("🔗 Assigning permissions to roles...");

    const allPermissions = await prisma.permission.findMany();

    // Helper function to assign permissions
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

    // ADMIN gets all permissions
    for (const p of allPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
            update: {},
            create: { roleId: adminRole.id, permissionId: p.id }
        });
    }

    // ENCARGADO gets everything except users.manage
    const encargadoActions = allPermissions
        .filter(p => p.action !== "users.manage")
        .map(p => p.action);
    await assignPermissions(encargadoRole.id, encargadoActions);

    // COMPRAS permissions
    const comprasActions = [
        "purchases.manage", "purchases.view",
        "suppliers.manage", "suppliers.view",
        "users.view"
    ];
    await assignPermissions(comprasRole.id, comprasActions);

    // DEPOSITO permissions
    const depositoActions = [
        "inventory.manage", "inventory.view",
        "warehouses.manage", "warehouses.view",
        "transfers.manage", "transfers.view",
        "loans.manage", "loans.view",
        "deliveries.manage", "deliveries.view",
        "receipts.manage", "receipts.view",
        "institutions.manage", "institutions.view",
        "categories.view", "warehouses.view",
        "users.view"
    ];
    await assignPermissions(depositoRole.id, depositoActions);

    // TECNICO permissions (only deliveries)
    const tecnicoActions = [
        "deliveries.manage", "deliveries.view",
    ];
    await assignPermissions(tecnicoRole.id, tecnicoActions);

    console.log("✅ Assigned permissions to roles");

    // ==================== CREATE DEFAULT WAREHOUSE ====================
    console.log("🏭 Creating default warehouse...");

    try {
        const defaultWarehouse = await prisma.warehouse.upsert({
            where: { code: "WH-MAIN" },
            update: {},
            create: {
                name: "Depósito Principal",
                code: "WH-MAIN",
                description: "Depósito principal del sistema",
                address: "Sede central",
                isActive: true,
            },
        });
        console.log(`✅ Default warehouse created/updated: ${defaultWarehouse.name}`);
    } catch (error: any) {
        if (error.code === "P2002") {
            console.log("✅ Default warehouse already exists");
        } else {
            throw error;
        }
    }

    // ==================== CREATE USERS ====================
    const adminPassword = await bcrypt.hash("admin123", 10);
    const encargadoPassword = await bcrypt.hash("encargado123", 10);
    const comprasPassword = await bcrypt.hash("compras123", 10);
    const depositoPassword = await bcrypt.hash("deposito123", 10);
    const tecnicoPassword = await bcrypt.hash("tecnico123", 10);

    const usersToCreate = [
        {
            email: "admin@gmail.com",
            username: "admin",
            firstName: "Admin",
            lastName: "User",
            password: adminPassword,
            role: adminRole
        },
        {
            email: "encargado@gmail.com",
            username: "encargado",
            firstName: "Encargado",
            lastName: "General",
            password: encargadoPassword,
            role: encargadoRole
        },
        {
            email: "compras@gmail.com",
            username: "compras",
            firstName: "Responsable",
            lastName: "Compras",
            password: comprasPassword,
            role: comprasRole
        },
        {
            email: "deposito@gmail.com",
            username: "deposito",
            firstName: "Responsable",
            lastName: "Depósito",
            password: depositoPassword,
            role: depositoRole
        },
        {
            email: "tecnico@gmail.com",
            username: "tecnico",
            firstName: "Técnico",
            lastName: "Mantenimiento",
            password: tecnicoPassword,
            role: tecnicoRole
        }
    ];

    for (const u of usersToCreate) {
        console.log(`👤 Creating/Updating user: ${u.email}...`);
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: u.password // Actualizar contraseña por si cambió en el seed
            },
            create: {
                email: u.email,
                username: u.username,
                password: u.password,
                firstName: u.firstName,
                lastName: u.lastName,
                isActive: true,
            },
        });

        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: u.role.id } },
            update: {},
            create: { userId: user.id, roleId: u.role.id },
        });
    }

    console.log("✅ Database seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
