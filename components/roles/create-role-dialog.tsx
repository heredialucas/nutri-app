"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createRoleAction } from "@/app/actions/roles";
import { Plus } from "lucide-react";
// import { Textarea } from "@/components/ui/textarea"; // Assuming it exists or use Input for now

export function CreateRoleDialog({ permissions = [] }: { permissions?: any[] }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const usersViewPerm = permissions.find(p => p.action === "users.view");
        const finalPermissions = usersViewPerm 
            ? Array.from(new Set([...selectedPermissions, usersViewPerm.id]))
            : selectedPermissions;

        const result = await createRoleAction({ name, description, permissionIds: finalPermissions });

        if (result.error) {
            setError(result.error);
        } else {
            setOpen(false);
            setName("");
            setDescription("");
            setSelectedPermissions([]);
        }
        setLoading(false);
    };

    const togglePermission = (id: string) => {
        const isMandatory = permissions.find(p => p.id === id)?.action === "users.view";
        if (isMandatory) return;

        setSelectedPermissions(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Rol
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Rol</DialogTitle>
                        <DialogDescription>
                            Define un nuevo rol para asignar permisos a usuarios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-4">
                            <Label htmlFor="name" className="sm:text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="sm:col-span-3"
                                placeholder="Ej. Vendedor"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-4">
                            <Label htmlFor="description" className="sm:text-right">
                                Descripción
                            </Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="sm:col-span-3"
                                placeholder="Descripción del rol"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <Label className="sm:text-right sm:pt-2">Permisos</Label>
                            <div className="sm:col-span-3 border rounded-md p-3 h-64 overflow-y-auto space-y-4">
                                {permissions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No hay permisos disponibles.</p>
                                ) : (
                                    // Group permissions by prefix (inventory, sales, etc)
                                    Object.entries(permissions.reduce<Record<string, any[]>>((acc, perm) => {
                                        const prefix = perm.action.split('.')[0];
                                        const groupTranslations: Record<string, string> = {
                                            dashboard: "Panel",
                                            patients: "Pacientes",
                                            medical_history: "Historia Clínica",
                                            appointments: "Turnos",
                                            availability: "Disponibilidad",
                                            measurements: "Mediciones",
                                            nutrition_plans: "Planes Alimentarios",
                                            recipes: "Recetas",
                                            followups: "Seguimiento",
                                            files: "Archivos",
                                            consents: "Consentimientos",
                                            payments: "Cobros",
                                            expenses: "Gastos",
                                            reports: "Reportes",
                                            messages: "Mensajes",
                                            users: "Usuarios",
                                            settings: "Configuración"
                                        };
                                        const groupName = groupTranslations[prefix] || prefix;
                                        if (!acc[groupName]) acc[groupName] = [];
                                        acc[groupName].push(perm);
                                        return acc;
                                    }, {})).map(([prefix, perms]) => (
                                        <div key={prefix}>
                                            <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">{prefix}</h5>
                                            <div className="space-y-2">
                                                {perms.map(perm => (
                                                    <div key={perm.id} className="flex items-center justify-between space-x-2 bg-muted/40 p-2 rounded-sm">
                                                        <Label htmlFor={`perm-${perm.id}`} className="text-sm font-normal cursor-pointer flex-1">
                                                            <span className="font-mono text-xs font-semibold mr-1">{perm.action}</span>
                                                            <br />
                                                            <span className="text-[10px] text-muted-foreground">{perm.description}</span>
                                                        </Label>
                                                        <Checkbox
                                                            id={`perm-${perm.id}`}
                                                            checked={perm.action === "users.view" || selectedPermissions.includes(perm.id)}
                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                            disabled={perm.action === "users.view"}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Rol"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
