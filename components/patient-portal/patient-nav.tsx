"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
    LayoutDashboard,
    CalendarDays,
    UtensilsCrossed,
    ClipboardCheck,
    FolderOpen,
    User,
    Menu,
    X,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
    { href: "/paciente/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/paciente/dashboard/turnos", label: "Turnos", icon: CalendarDays },
    { href: "/paciente/dashboard/plan", label: "Mi Plan", icon: UtensilsCrossed },
    { href: "/paciente/dashboard/seguimiento", label: "Seguimiento", icon: ClipboardCheck },
    { href: "/paciente/dashboard/archivos", label: "Archivos", icon: FolderOpen },
    { href: "/paciente/dashboard/configuracion", label: "Configuracion", icon: MessageSquare },
];

export function PatientNav({ userName }: { userName?: string }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("patient-sidebar-collapsed");
        if (saved !== null) setCollapsed(saved === "true");
    }, []);

    const toggleCollapsed = useCallback(() => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem("patient-sidebar-collapsed", String(next));
            return next;
        });
    }, []);

    const isCollapsed = collapsed;

    return (
        <TooltipProvider delayDuration={0}>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shadow-lg"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/20 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <nav
                className={cn(
                    "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[rgba(0,0,0,0.06)] px-4 py-3 transition-transform",
                    mobileOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="flex justify-around">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/paciente/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex flex-col items-center gap-1 text-xs py-1 px-2 rounded-lg transition-colors",
                                    isActive
                                        ? "text-[#1a1a1a] font-semibold"
                                        : "text-[#999]"
                                )}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Desktop sidebar */}
            <aside className={cn(
                "hidden md:flex flex-col shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-white h-screen sticky top-0 transition-[width] duration-200 ease-in-out overflow-hidden",
                isCollapsed ? "w-16" : "w-56",
            )}>
                {/* Header: patient name + collapse toggle */}
                <div className={cn(
                    "h-14 border-b border-[rgba(0,0,0,0.06)] flex items-center shrink-0",
                    isCollapsed ? "justify-center px-0" : "px-4 gap-2",
                )}>
                    {isCollapsed ? (
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1a1a1a] text-white font-bold text-[11px] tracking-tight shrink-0">
                            {userName ? userName.charAt(0).toUpperCase() : "U"}
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-[#1a1a1a] truncate">
                            {userName || "Mi cuenta"}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        className={cn(
                            "p-1.5 rounded-md text-[#999] hover:text-[#1a1a1a] hover:bg-[rgba(0,0,0,0.04)] transition-colors shrink-0",
                            isCollapsed ? "" : "ml-auto",
                        )}
                        aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
                    >
                        {isCollapsed ? (
                            <PanelLeftOpen className="h-4 w-4" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <nav aria-label="Navegación del paciente" className={cn("flex-1 py-3 space-y-0.5", isCollapsed ? "px-2" : "px-3")}>
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/paciente/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                        const link = (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg text-sm transition-colors no-underline",
                                    isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                                    isActive
                                        ? "bg-[rgba(0,0,0,0.04)] text-[#1a1a1a] font-medium"
                                        : "text-[#666] hover:bg-[rgba(0,0,0,0.02)] hover:text-[#1a1a1a]"
                                )}
                            >
                                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        );

                        if (isCollapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        {link}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={8}>
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return link;
                    })}
                </nav>

                {/* Footer: Mauro Acosta logo */}
                <div className={cn(
                    "border-t border-[rgba(0,0,0,0.06)] shrink-0",
                    isCollapsed ? "p-2" : "p-3 flex justify-center",
                )}>
                    <Image
                        src="/images/logoMauroAcostaRectangular.png"
                        alt="Mauro Acosta"
                        width={isCollapsed ? 28 : 120}
                        height={isCollapsed ? 28 : 30}
                        className={cn(
                            "object-contain",
                            isCollapsed ? "mx-auto opacity-50" : "opacity-60",
                        )}
                    />
                </div>
            </aside>
        </TooltipProvider>
    );
}
