"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deletePatient, reactivatePatient } from "@/app/actions/patients";
import { Search, Phone, Mail, Trash2, RotateCcw } from "lucide-react";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: string;
    billingType: string;
    healthInsurance: string | null;
    createdAt: string;
    deletedAt: string | null;
    _count: {
        appointments: number;
        measurements: number;
        nutritionPlans: number;
        followUps: number;
    };
}

type Tab = "all" | "ACTIVE" | "ARCHIVED" | "trashed";

export function PatientList({
    initialPatients,
    defaultTab = "all",
}: {
    initialPatients: Patient[];
    defaultTab?: Tab;
}) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Tab | null>(defaultTab === "trashed" ? null : defaultTab);
    const router = useRouter();
    const pathname = usePathname();

    const isTrashed = defaultTab === "trashed";

    const goToTab = (tab: Tab) => {
        if (tab === "trashed") {
            router.push(`${pathname}?tab=trashed`);
        } else {
            router.push(pathname);
            setFilter(tab);
        }
    };

    const filtered = initialPatients.filter((p) => {
        const matchesSearch =
            !search ||
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            p.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.phone?.includes(search);

        const matchesFilter = filter === null || filter === "all" || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleDelete = async (id: string) => {
        await deletePatient(id);
        router.refresh();
    };

    const handleReactivate = async (id: string) => {
        await reactivatePatient(id);
        router.push(pathname);
        router.refresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={!isTrashed && (filter === "all" || filter === null) ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToTab("all")}
                    >
                        Todos
                    </Button>
                    <Button
                        variant={filter === "ACTIVE" ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToTab("ACTIVE")}
                    >
                        Activos
                    </Button>
                    <Button
                        variant={filter === "ARCHIVED" ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToTab("ARCHIVED")}
                    >
                        Archivados
                    </Button>
                    <Button
                        variant={isTrashed ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToTab("trashed")}
                    >
                        Eliminados
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {search
                            ? "No se encontraron pacientes con esa búsqueda"
                            : isTrashed
                              ? "No hay pacientes eliminados"
                              : "No hay pacientes registrados"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((patient) => (
                        <div
                            key={patient.id}
                            className="flex items-stretch gap-2"
                        >
                            <Link
                                href={`/dashboard/pacientes/${patient.id}`}
                                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group flex-1 min-w-0"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <span className="text-sm font-medium">
                                            {patient.firstName[0]}{patient.lastName[0]}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">
                                            {patient.firstName} {patient.lastName}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {patient.email && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <Mail className="h-3 w-3" />
                                                    {patient.email}
                                                </span>
                                            )}
                                            {patient.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {patient.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{patient._count.appointments} turnos</span>
                                        <span>·</span>
                                        <span>{patient._count.measurements} mediciones</span>
                                    </div>
                                    <Badge
                                        variant={
                                            isTrashed
                                                ? "destructive"
                                                : patient.status === "ACTIVE"
                                                  ? "default"
                                                  : "secondary"
                                        }
                                    >
                                        {isTrashed ? "Eliminado" : patient.status === "ACTIVE" ? "Activo" : "Archivado"}
                                    </Badge>
                                </div>
                            </Link>
                            <div className="flex items-center">
                                {isTrashed ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                                aria-label={`Reactivar paciente ${patient.firstName} ${patient.lastName}`}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    ¿Activar cuenta?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Se reactivará a{" "}
                                                    <span className="font-medium text-foreground">
                                                        {patient.firstName} {patient.lastName}
                                                    </span>{" "}
                                                    y su cuenta podrá iniciar sesión nuevamente. Sus registros
                                                    quedarán visibles en el listado.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleReactivate(patient.id)}>
                                                    Activar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                aria-label={`Eliminar paciente ${patient.firstName} ${patient.lastName}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    ¿Eliminar paciente?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Se eliminará a{" "}
                                                    <span className="font-medium text-foreground">
                                                        {patient.firstName} {patient.lastName}
                                                    </span>{" "}
                                                    de la lista. Sus registros clínicos y estadísticas se conservan,
                                                    pero dejará de aparecer en el listado.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={() => handleDelete(patient.id)}
                                                >
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
