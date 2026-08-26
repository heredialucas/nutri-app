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
    Menu,
    X,
    MessageSquare,
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/paciente/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/paciente/dashboard/turnos", label: "Turnos", icon: CalendarDays },
    { href: "/paciente/dashboard/plan", label: "Mi Plan", icon: UtensilsCrossed },
    { href: "/paciente/dashboard/seguimiento", label: "Seguimiento", icon: ClipboardCheck },
    { href: "/paciente/dashboard/archivos", label: "Archivos", icon: FolderOpen },
    { href: "/paciente/dashboard/configuracion", label: "Config", icon: MessageSquare },
];

export function PatientNav() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
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
            <nav className="hidden md:flex flex-col w-56 shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-white h-screen sticky top-0">
                <div className="px-4 pt-6 pb-4">
                    <Link href="/" className="flex items-baseline gap-1 text-base font-semibold no-underline text-[#1a1a1a]">
                        <span>Mauro</span>
                        <span className="text-[rgba(0,0,0,0.3)]">Acosta</span>
                    </Link>
                </div>
                <div className="flex-1 px-3">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/paciente/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 no-underline",
                                    isActive
                                        ? "bg-[rgba(0,0,0,0.04)] text-[#1a1a1a] font-medium"
                                        : "text-[#666] hover:bg-[rgba(0,0,0,0.02)] hover:text-[#1a1a1a]"
                                )}
                            >
                                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
