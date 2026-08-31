"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarDays,
    UtensilsCrossed,
    ClipboardCheck,
    FolderOpen,
    User,
    MessageSquare,
    Activity,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const patientNavItems = [
    { href: "/paciente/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/paciente/dashboard/turnos", label: "Turnos", icon: CalendarDays },
    { href: "/paciente/dashboard/plan", label: "Mi Plan", icon: UtensilsCrossed },
    { href: "/paciente/dashboard/seguimiento", label: "Seguimiento", icon: ClipboardCheck },
    { href: "/paciente/dashboard/antropometria", label: "Mi evolución", icon: Activity },
    { href: "/paciente/dashboard/archivos", label: "Archivos", icon: FolderOpen },
    { href: "/paciente/dashboard/perfil", label: "Mis datos", icon: User },
    { href: "/paciente/dashboard/configuracion", label: "Notificaciones", icon: MessageSquare },
];

export type PatientNavLinksProps = {
    collapsed?: boolean;
    onNavigate?: () => void;
    className?: string;
};

export function PatientNavLinks({ collapsed = false, onNavigate, className }: PatientNavLinksProps) {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Navegación del paciente"
            className={cn("flex-1 py-3 space-y-0.5", collapsed ? "px-2" : "px-3", className)}
        >
            {patientNavItems.map((item) => {
                const isActive =
                    item.href === "/paciente/dashboard"
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                const link = (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-label={item.label}
                        className={cn(
                            "flex items-center gap-3 rounded-lg text-sm transition-colors no-underline",
                            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                            isActive
                                ? "bg-[rgba(0,0,0,0.04)] text-[#1a1a1a] font-medium"
                                : "text-[#666] hover:bg-[rgba(0,0,0,0.02)] hover:text-[#1a1a1a]"
                        )}
                    >
                        <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                        {!collapsed && <span>{item.label}</span>}
                    </Link>
                );

                if (collapsed) {
                    return (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                }

                return link;
            })}
        </nav>
    );
}
