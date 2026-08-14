import prisma from "@/lib/prisma";

/**
 * Seed permissions for the inventory control system
 * Uses a simplified model: manage (CRUD) and view (read-only) per module
 */
export async function seedPermissions() {
    const permissions = [
        // Inventory & Products
        {
            action: "inventory.manage",
            description: "Create, edit, and delete products",
        },
        {
            action: "inventory.view",
            description: "View products and stock levels",
        },

        // Warehouses
        {
            action: "warehouses.manage",
            description: "Create, edit, and delete warehouses",
        },
        {
            action: "warehouses.view",
            description: "View warehouses and their stock",
        },

        // Transfers
        {
            action: "transfers.manage",
            description: "Create, complete, and cancel warehouse transfers",
        },
        {
            action: "transfers.view",
            description: "View warehouse transfers",
        },
        {
            action: "loans.manage",
            description: "Register and manage material loans",
        },
        {
            action: "loans.view",
            description: "View material loans",
        },

        // Purchases
        {
            action: "purchases.manage",
            description: "Create, edit, receive, and cancel purchase orders",
        },
        {
            action: "purchases.view",
            description: "View purchase orders",
        },

        // Deliveries
        {
            action: "deliveries.manage",
            description: "Create, confirm, deliver, and cancel deliveries",
        },
        {
            action: "deliveries.view",
            description: "View deliveries",
        },

        // Suppliers
        {
            action: "suppliers.manage",
            description: "Create, edit, and delete suppliers",
        },
        {
            action: "suppliers.view",
            description: "View suppliers",
        },

        // Institutions
        {
            action: "institutions.manage",
            description: "Create, edit, and delete institutions",
        },
        {
            action: "institutions.view",
            description: "View institutions",
        },

        // Reports & Analytics
        {
            action: "reports.view",
            description: "View all reports and analytics",
        },

        // Users & Roles (Admin)
        {
            action: "users.manage",
            description: "Manage users, roles, and permissions",
        },
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
