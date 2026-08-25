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
}

const defaultData: PatientFormData = {
    firstName: "",
    lastName: "",
    phone: "",
    billingType: "PARTICULAR",
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
                });
                toast.success("Paciente creado exitosamente");
                router.push("/dashboard/pacientes");
            } else {
                await updatePatient(initialData!.id!, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone || undefined,
                    billingType: formData.billingType,
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
