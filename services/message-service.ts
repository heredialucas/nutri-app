import prisma from "@/lib/prisma";

export const messageService = {
    async getThreads(professionalId: string) {
        return prisma.messageThread.findMany({
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getThread(threadId: string) {
        return prisma.messageThread.findUnique({
            where: { id: threadId },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                messages: {
                    include: {
                        // author info comes from User relation
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },

    async getOrCreateThread(patientId: string) {
        let thread = await prisma.messageThread.findFirst({
            where: { patientId },
        });

        if (!thread) {
            thread = await prisma.messageThread.create({
                data: { patientId },
            });
        }

        return thread;
    },

    async sendMessage(threadId: string, authorId: string, content: string) {
        return prisma.message.create({
            data: {
                threadId,
                authorId,
                content,
            },
        });
    },

    async getUnreadCount(threadId: string, lastSeen: Date) {
        return prisma.message.count({
            where: {
                threadId,
                createdAt: { gt: lastSeen },
            },
        });
    },
};
