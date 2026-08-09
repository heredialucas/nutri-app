"use server";

import { userService } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission, isAdminUser } from "@/lib/auth";

export async function getUsersAction() {
    try {
        const users = await userService.getUsers();
        return { success: true, data: users };
    } catch (error) {
        return { success: false, error: "Error al obtener usuarios" };
    }
}

export async function createUserAction(data: { email: string; password?: string; firstName?: string; lastName?: string; roleIds?: string[] }) {
    if (!data.email) return { error: "El email es obligatorio" };

    try {
        await userService.createUser(data);
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        return { error: "Error al crear usuario. El email podría estar duplicado." };
    }
}

export async function updateUserAction(id: string, data: { firstName?: string; lastName?: string; roleIds?: string[] }) {
    try {
        await userService.updateUser(id, data);
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Error al actualizar usuario" };
    }
}

export async function deleteUserAction(id: string) {
    try {
        await userService.deleteUser(id);
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        return { error: "Error al eliminar usuario" };
    }
}

export async function changeUserPasswordAction(
    userId: string,
    password: string,
    passwordConfirmation: string,
) {
    const currentUser = await getCurrentUser();

    if (!currentUser || (!isAdminUser(currentUser) && !hasPermission(currentUser, "users.manage"))) {
        return { error: "No autorizado" };
    }

    if (!userId) return { error: "Usuario requerido" };
    if (password.length < 8) {
        return { error: "La contraseña debe tener al menos 8 caracteres" };
    }
    if (password !== passwordConfirmation) {
        return { error: "Las contraseñas no coinciden" };
    }

    try {
        await userService.updatePassword(userId, password);
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Error al cambiar la contraseña" };
    }
}
