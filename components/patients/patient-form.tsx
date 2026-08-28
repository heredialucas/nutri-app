"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPatient, updatePatient } from "@/app/actions/patients";
import { toast } from "sonner";

interface PatientFormData {
    firstName: string;
    lastName: string;
    phone: string;
    billingType: string;
    gender: string;
    birthDate: string;
}

const defaultData: PatientFormData = {
    firstName: "",
    lastName: "",
    phone: "",
    billingType: "PARTICULAR",
    gender: "",
    birthDate: "",
};

export function PatientForm({
    mode = "create",
    initialData,
}: {
    mode?: "create" | "edit";
    initialData?: Partial<PatientFormData & { id: string }>;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PatientFormData>({
        ...defaultData,
        ...initialData,
        birthDate: initialData?.birthDate
            ? new Date(initialData.birthDate).toISOString().split("T")[0]
            : "",
        gender: initialData?.gender || "",
    });

    const handleChange = (field: keyof PatientFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "create") {
                await createPatient({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone || undefined,
                    billingType: formData.billingType,
                    gender: formData.gender || undefined,
                    birthDate: formData.birthDate || undefined,
                });
                toast.success("Paciente creado exitosamente");
                router.push("/dashboard/pacientes");
            } else {
                await updatePatient(initialData!.id!, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone || undefined,
                    billingType: formData.billingType,
                    gender: formData.gender || undefined,
                    birthDate: formData.birthDate || undefined,
                });
                toast.success("Paciente actualizado exitosamente");
                router.push(`/dashboard/pacientes/${initialData!.id}`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar el paciente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Datos del paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => handleChange("lastName", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={formData.birthDate}
                                onChange={(e) => handleChange("birthDate", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Género</Label>
                            <Select
                                value={formData.gender || " "}
                                onValueChange={(value) => handleChange("gender", value === " " ? "" : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar (necesario para ISAK)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Sin especificar</SelectItem>
                                    <SelectItem value="MALE">Masculino</SelectItem>
                                    <SelectItem value="FEMALE">Femenino</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billingType">Tipo de facturación *</Label>
                            <Select
                                value={formData.billingType}
                                onValueChange={(value) => handleChange("billingType", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PARTICULAR">Particular</SelectItem>
                                    <SelectItem value="OBRA_SOCIAL">Obra social</SelectItem>
                                    <SelectItem value="MIXTO">Mixto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : mode === "create" ? "Crear paciente" : "Guardar cambios"}
                </Button>
            </div>
        </form>
    );
}
