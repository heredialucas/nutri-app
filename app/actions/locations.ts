"use server";

import { locationService } from "@/services/location-service";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

async function requireManage() {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!isAdminUser(user)) {
        throw new Error("No tenés permisos para gestionar sedes");
    }
    return user;
}

function revalidateLocations() {
    revalidatePath("/dashboard/configuracion/sedes");
    revalidatePath("/dashboard/turnos/disponibilidad");
    revalidatePath("/reservar/sede");
}

export async function getLocations() {
    await requireManage();
    const locations = await locationService.list();
    return serializePrisma(locations);
}

export async function createLocation(data: { name: string; address: string }) {
    await requireManage();
    const location = await locationService.create(data);
    revalidateLocations();
    return serializePrisma(location);
}

export async function updateLocation(
    id: string,
    data: { name?: string; address?: string; isActive?: boolean },
) {
    await requireManage();
    const location = await locationService.update(id, data);
    revalidateLocations();
    return serializePrisma(location);
}

export async function deleteLocation(id: string) {
    await requireManage();
    await locationService.remove(id);
    revalidateLocations();
    return { success: true };
}
