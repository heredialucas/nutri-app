"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EditUserDialog } from "@/components/users/edit-user-dialog";

interface UserListProps {
    users: any[];
    roles?: any[];
    canManage?: boolean;
}

export function UserList({ users, roles, canManage = false }: UserListProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const handleDelete = (userId: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;

        setError("");
        startTransition(async () => {
            const result = await deleteUserAction(userId);
            if (result.error) {
                setError(result.error);
                return;
            }

            router.refresh();
        });
    };

    const translateRoleName = (name: string) => {
        const translations: Record<string, string> = {
            ADMIN: "Administrador",
            MANAGER: "Encargado",
            VIEWER: "Empleado"
        };
        return translations[name] || name;
    };
    if (users.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg text-muted-foreground bg-card">
                No hay usuarios registrados.
            </div>
        );
    }

    return (
        <>
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}

            {/* Desktop Table View */}
            <div className="rounded-md border hidden md:block bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            {canManage && <TableHead className="text-right">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <UserRow
                                key={user.id}
                                user={user}
                                roles={roles || []}
                                canManage={canManage}
                                onDelete={handleDelete}
                                isPending={isPending}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {user.firstName || user.lastName
                                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                    : "Sin nombre"
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-4">{user.email}</div>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {user.userRoles?.length > 0 ? (
                                    user.userRoles.map((ur: any) => (
                                        <Badge key={ur.role.id} variant="secondary" className="text-xs">
                                            {translateRoleName(ur.role.name)}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-xs">Sin roles</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-muted-foreground">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                                {canManage && (
                                    <div className="flex items-center gap-2">
                                        <EditUserDialog user={user} roles={roles || []} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => handleDelete(user.id)}
                                            disabled={isPending}
                                            aria-label={`Eliminar usuario ${user.email}`}
                                        >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}

interface UserRowProps {
    user: any;
    roles: any[];
    canManage?: boolean;
    onDelete: (userId: string) => void;
    isPending: boolean;
}

function UserRow({ user, roles, canManage = false, onDelete, isPending }: UserRowProps) {
    const translateRoleName = (name: string) => {
        const translations: Record<string, string> = {
            ADMIN: "Administrador",
            MANAGER: "Encargado",
            VIEWER: "Empleado"
        };
        return translations[name] || name;
    };
    return (
        <TableRow>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>
                {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : "-"
                }
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {user.userRoles?.length > 0 ? (
                        user.userRoles.map((ur: any) => (
                            <Badge key={ur.role.id} variant="secondary" className="text-xs">
                                {translateRoleName(ur.role.name)}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground text-xs">Sin roles</span>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            {canManage && (
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <EditUserDialog user={user} roles={roles} />
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => onDelete(user.id)}
                            disabled={isPending}
                            aria-label={`Eliminar usuario ${user.email}`}
                        >
                                <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </TableCell>
            )}
        </TableRow>
    );
}
