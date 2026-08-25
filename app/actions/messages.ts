"use server";

import { messageService } from "@/services/message-service";
import { getCurrentUser, hasPermission, isPatientUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

async function requireAuth(permission?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (permission && !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
}

export async function getMessageThreads() {
    await requireAuth("messages:read");
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const threads = await messageService.getThreads(user.id);
    return serializePrisma(threads);
}

export async function getMessageThread(threadId: string) {
    await requireAuth("messages:read");
    const thread = await messageService.getThread(threadId);
    if (!thread) throw new Error("Hilo de mensajes no encontrado");
    return serializePrisma(thread);
}

export async function sendMessage(threadId: string, content: string) {
    await requireAuth("messages:send");

    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!content?.trim()) throw new Error("El mensaje no puede estar vacío");

    const message = await messageService.sendMessage(threadId, user.id, content.trim());
    revalidatePath(`/dashboard/messages/${threadId}`);
    return serializePrisma(message);
}

export async function getOrCreateThread(patientId: string) {
    await requireAuth("messages:read");
    const thread = await messageService.getOrCreateThread(patientId);
    revalidatePath("/dashboard/messages");
    return serializePrisma(thread);
}
