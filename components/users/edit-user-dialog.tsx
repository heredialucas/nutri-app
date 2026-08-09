
"use client";

import { useState, useEffect } from "react";
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
import { changeUserPasswordAction, updateUserAction } from "@/app/actions/users";
import { Check, Clipboard, KeyRound, Pencil, WandSparkles } from "lucide-react";

interface EditUserDialogProps {
    user: any;
    roles: any[];
}

export function EditUserDialog({ user, roles }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [firstName, setFirstName] = useState(user.firstName || "");
    const [lastName, setLastName] = useState(user.lastName || "");
    const [newPassword, setNewPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [copied, setCopied] = useState(false);

    // Initialize selected roles from user's current roles
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const translateRoleName = (name: string) => {
        const translations: Record<string, string> = {
            ADMIN: "Administrador",
            MANAGER: "Encargado",
            VIEWER: "Empleado"
        };
        return translations[name] || name;
    };

    // Reset state when dialog opens or user changes
    useEffect(() => {
        if (open) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setSelectedRoles(user.userRoles?.map((ur: any) => ur.role.id) || []);
            setNewPassword("");
            setPasswordConfirmation("");
            setCopied(false);
            setError("");
        }
    }, [open, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (newPassword || passwordConfirmation) {
            if (newPassword.length < 8) {
                setError("La contraseña debe tener al menos 8 caracteres");
                setLoading(false);
                return;
            }
            if (newPassword !== passwordConfirmation) {
                setError("Las contraseñas no coinciden");
                setLoading(false);
                return;
            }
        }

        let result = await updateUserAction(user.id, {
            firstName,
            lastName,
            roleIds: selectedRoles
        });

        if (!result.error && (newPassword || passwordConfirmation)) {
            result = await changeUserPasswordAction(user.id, newPassword, passwordConfirmation);
        }

        if (result.error) {
            setError(result.error);
        } else {
            setOpen(false);
        }
        setLoading(false);
    };

    const generatePassword = () => {
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?";
        const values = new Uint32Array(20);
        crypto.getRandomValues(values);
        const password = Array.from(values, (value) => alphabet[value % alphabet.length]).join("");

        setNewPassword(password);
        setPasswordConfirmation(password);
        setCopied(false);
        setError("");
    };

    const copyPassword = async () => {
        if (!newPassword) return;

        try {
            await navigator.clipboard.writeText(newPassword);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("No se pudo copiar la contraseña");
        }
    };

    const toggleRole = (id: string) => {
        setSelectedRoles(prev =>
            prev.includes(id)
                ? prev.filter(r => r !== id)
                : [...prev, id]
        );
    }

    // No permitir asignar rol ADMIN al editar usuarios
    const availableRoles = roles.filter(role => role.name !== "ADMIN");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modificar datos personales y roles asignados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-4">
                            <Label className="sm:text-right">Email</Label>
                            <Input
                                value={user.email}
                                disabled
                                className="sm:col-span-3 bg-muted"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-4">
                            <Label htmlFor="edit-firstname" className="sm:text-right">
                                Nombre
                            </Label>
                            <Input
                                id="edit-firstname"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="sm:col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-4">
                            <Label htmlFor="edit-lastname" className="sm:text-right">
                                Apellido
                            </Label>
                            <Input
                                id="edit-lastname"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="sm:col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <Label className="sm:text-right sm:pt-2">Roles</Label>
                            <div className="sm:col-span-3 border rounded-md p-3 h-48 overflow-y-auto space-y-2">
                                {availableRoles.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No hay roles disponibles.</p>
                                ) : (
                                    availableRoles.map(role => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-role-${role.id}`}
                                                checked={selectedRoles.includes(role.id)}
                                                onCheckedChange={() => toggleRole(role.id)}
                                            />
                                            <Label htmlFor={`edit-role-${role.id}`} className="text-sm font-normal cursor-pointer leading-none">
                                                <span className="font-semibold mr-1">{translateRoleName(role.name)}</span>
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <KeyRound className="mt-0.5 h-4 w-4 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Cambiar contraseña</p>
                                    <p className="text-xs text-muted-foreground">
                                        Opcional. Genera una contraseña segura o escribe una propia.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    id="edit-password"
                                    type="text"
                                    autoComplete="new-password"
                                    placeholder="Nueva contraseña"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={generatePassword}
                                    title="Generar contraseña segura"
                                    aria-label="Generar contraseña segura"
                                >
                                    <WandSparkles className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={copyPassword}
                                    disabled={!newPassword}
                                    title="Copiar contraseña"
                                    aria-label="Copiar contraseña"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Input
                                id="edit-password-confirmation"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Repetir contraseña"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Mínimo 8 caracteres. Guarda los cambios para aplicar la nueva contraseña.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
