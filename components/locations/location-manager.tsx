"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    createLocation,
    updateLocation,
    deleteLocation,
} from "@/app/actions/locations";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";

interface LocationItem {
    id: string;
    name: string;
    address: string;
    isActive: boolean;
}

export function LocationManager({ locations }: { locations: LocationItem[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", address: "" });

    const resetForm = () => {
        setForm({ name: "", address: "" });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await updateLocation(editingId, form);
                toast.success("Sede actualizada");
            } else {
                await createLocation(form);
                toast.success("Sede creada");
            }
            resetForm();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (location: LocationItem) => {
        setEditingId(location.id);
        setForm({ name: location.name, address: location.address });
    };

    const handleToggle = async (location: LocationItem) => {
        try {
            await updateLocation(location.id, { isActive: !location.isActive });
            toast.success(location.isActive ? "Sede desactivada" : "Sede activada");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        }
    };

    const handleDelete = async (location: LocationItem) => {
        if (!confirm(`¿Eliminar la sede "${location.name}"?`)) return;
        try {
            await deleteLocation(location.id);
            toast.success("Sede eliminada");
            if (editingId === location.id) resetForm();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {editingId ? "Editar sede" : "Agregar sede"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] sm:items-end gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="sede-name">Nombre</Label>
                            <Input
                                id="sede-name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Ej: Sede Centro"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="sede-address">Dirección</Label>
                            <Input
                                id="sede-address"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder="Ej: San Miguel de Tucumán, Tucumán"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                                <Plus className="mr-2 h-4 w-4" />
                                {editingId ? "Guardar" : "Agregar"}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {locations.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            Todavía no hay sedes cargadas.
                        </CardContent>
                    </Card>
                ) : (
                    locations.map((location) => (
                        <Card key={location.id}>
                            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{location.name}</p>
                                        <Badge variant={location.isActive ? "default" : "secondary"}>
                                            {location.isActive ? "Activa" : "Inactiva"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        <span className="break-words">{location.address}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggle(location)}
                                    >
                                        {location.isActive ? "Desactivar" : "Activar"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEdit(location)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(location)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
