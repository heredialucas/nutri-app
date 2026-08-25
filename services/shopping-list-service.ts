import prisma from "@/lib/prisma";

export const shoppingListService = {
    async list(filters?: { patientId?: string; nutritionPlanId?: string }) {
        const where: Record<string, any> = {};
        if (filters?.patientId) where.patientId = filters.patientId;
        if (filters?.nutritionPlanId) where.nutritionPlanId = filters.nutritionPlanId;

        return prisma.shoppingList.findMany({
            where,
            include: {
                items: { orderBy: { name: "asc" } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string) {
        return prisma.shoppingList.findUnique({
            where: { id },
            include: {
                items: { orderBy: { name: "asc" } },
            },
        });
    },

    async create(data: {
        title: string;
        patientId?: string;
        nutritionPlanId?: string;
        items?: { name: string; quantity?: string; unit?: string }[];
    }) {
        return prisma.shoppingList.create({
            data: {
                title: data.title,
                patientId: data.patientId,
                nutritionPlanId: data.nutritionPlanId,
                items: data.items
                    ? { create: data.items.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit })) }
                    : undefined,
            },
            include: { items: true },
        });
    },

    async addItem(listId: string, data: { name: string; quantity?: string; unit?: string }) {
        return prisma.shoppingListItem.create({
            data: { listId, ...data },
        });
    },

    async toggleItem(id: string) {
        const item = await prisma.shoppingListItem.findUnique({ where: { id } });
        return prisma.shoppingListItem.update({
            where: { id },
            data: { isChecked: !item?.isChecked },
        });
    },

    async deleteItem(id: string) {
        return prisma.shoppingListItem.delete({ where: { id } });
    },

    async delete(id: string) {
        return prisma.shoppingList.delete({ where: { id } });
    },

    async generateFromPlan(nutritionPlanId: string) {
        const plan = await prisma.nutritionPlan.findUnique({
            where: { id: nutritionPlanId },
            include: {
                days: {
                    include: {
                        meals: { include: { foods: true } },
                    },
                },
            },
        });

        if (!plan) throw new Error("Plan no encontrado");

        const items: { name: string; quantity?: string; unit?: string }[] = [];
        const seen = new Map<string, { name: string; quantity?: string; unit?: string }>();

        for (const day of plan.days) {
            for (const meal of day.meals) {
                for (const food of meal.foods) {
                    const key = food.name.toLowerCase();
                    if (seen.has(key)) {
                        // Merge quantities if same food
                        const existing = seen.get(key)!;
                        if (food.quantity && existing.quantity) {
                            existing.quantity = `${existing.quantity} + ${food.quantity}`;
                        }
                    } else {
                        const item = {
                            name: food.name,
                            quantity: food.quantity ?? undefined,
                            unit: food.unit ?? undefined,
                        };
                        seen.set(key, item);
                        items.push(item);
                    }
                }
            }
        }

        return this.create({
            title: `Lista de compras - ${plan.title}`,
            patientId: plan.patientId,
            nutritionPlanId,
            items,
        });
    },
};
