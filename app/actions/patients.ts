"use server";

import { patientService } from "@/services/patient-service";
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

export async function getPatients(filters?: { search?: string; status?: string; trashed?: boolean }) {
    const user = await requireAuth("patients:read");

    // Pacientes solo ven su propio registro
    if (isPatientUser(user)) {
        const patient = await patientService.getByUserId(user.id);
        return patient ? [serializePrisma(patient)] : [];
    }

    const patients = await patientService.list(filters);
    return serializePrisma(patients);
}

export async function getPatientById(id: string) {
    const user = await requireAuth("patients:read");
    const patient = await patientService.getById(id);

    if (!patient) throw new Error("Paciente no encontrado");

    // Pacientes solo ven su propio registro
    if (isPatientUser(user)) {
        const ownPatient = await patientService.getByUserId(user.id);
        if (ownPatient?.id !== id) throw new Error("No tienes acceso a este paciente");
    }

    return serializePrisma(patient);
}

export async function createPatient(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    documentNumber?: string;
    address?: string;
    city?: string;
    occupation?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    healthInsurance?: string;
    billingType: string;
    notes?: string;
}) {
    await requireAuth("patients:create");

    if (!data.firstName?.trim()) throw new Error("El nombre es obligatorio");
    if (!data.lastName?.trim()) throw new Error("El apellido es obligatorio");
    if (!data.billingType) throw new Error("El tipo de facturación es obligatorio");

    const patient = await patientService.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender || undefined,
        documentNumber: data.documentNumber?.trim() || undefined,
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        occupation: data.occupation?.trim() || undefined,
        emergencyContact: data.emergencyContact?.trim() || undefined,
        emergencyPhone: data.emergencyPhone?.trim() || undefined,
        healthInsurance: data.healthInsurance?.trim() || undefined,
        billingType: data.billingType,
        notes: data.notes?.trim() || undefined,
    });

    revalidatePath("/dashboard/pacientes");
    return serializePrisma(patient);
}

export async function updatePatient(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    documentNumber?: string;
    address?: string;
    city?: string;
    occupation?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    healthInsurance?: string;
    billingType?: string;
    notes?: string;
    status?: string;
}) {
    await requireAuth("patients:update");

    const updateData: Record<string, any> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.documentNumber !== undefined) updateData.documentNumber = data.documentNumber?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.occupation !== undefined) updateData.occupation = data.occupation?.trim() || null;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact?.trim() || null;
    if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone?.trim() || null;
    if (data.healthInsurance !== undefined) updateData.healthInsurance = data.healthInsurance?.trim() || null;
    if (data.billingType !== undefined) updateData.billingType = data.billingType;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;

    const patient = await patientService.update(id, updateData);
    revalidatePath("/dashboard/pacientes");
    revalidatePath(`/dashboard/pacientes/${id}`);
    return serializePrisma(patient);
}

export async function archivePatient(id: string) {
    await requireAuth("patients:delete");
    await patientService.archive(id);
    revalidatePath("/dashboard/pacientes");
    revalidatePath(`/dashboard/pacientes/${id}`);
    return { success: true };
}

export async function reactivatePatient(id: string) {
    await requireAuth("patients:update");
    await patientService.reactivate(id);
    revalidatePath("/dashboard/pacientes");
    revalidatePath(`/dashboard/pacientes/${id}`);
}

export async function deletePatient(id: string) {
    await requireAuth("patients:delete");
    await patientService.softDelete(id);
    revalidatePath("/dashboard/pacientes");
    revalidatePath(`/dashboard/pacientes/${id}`);
    return { success: true };
}
