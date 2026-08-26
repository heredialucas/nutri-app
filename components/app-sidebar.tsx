"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    Users,
    Calendar,
    CalendarDays,
    Clock,
    UtensilsCrossed,
    ChefHat,
    ShoppingCart,
    DollarSign,
    TrendingDown,
    BarChart3,
    ClipboardList,
    Shield,
    ChevronDown,
    ChevronRight,
    Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
    requiresAdmin?: boolean;
}

interface SidebarGroup {
    groupTitle: string;
    items: SidebarItem[];
    defaultOpen?: boolean;
}

const sidebarGroups: SidebarGroup[] = [
    {
        groupTitle: "Principal",
        defaultOpen: true,
        items: [
            {
                title: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                permission: "dashboard:view",
            },
        ],
    },
    {
        groupTitle: "Pacientes",
        defaultOpen: true,
        items: [
            {
                title: "Pacientes",
                href: "/dashboard/pacientes",
                icon: Users,
                permission: "patients:read",
            },
            {
                title: "Seguimientos",
                href: "/dashboard/seguimiento",
                icon: ClipboardList,
                permission: "followups:read",
            },
        ],
    },
    {
        groupTitle: "Agenda",
        defaultOpen: true,
        items: [
            {
                title: "Turnos",
                href: "/dashboard/turnos",
                icon: Calendar,
                permission: "appointments:read",
            },
            {
                title: "Calendario",
                href: "/dashboard/turnos/calendario",
                icon: CalendarDays,
                permission: "appointments:read",
            },
            {
                title: "Disponibilidad",
                href: "/dashboard/turnos/disponibilidad",
                icon: Clock,
                permission: "availability:read",
            },
        ],
    },
    {
        groupTitle: "Nutrición",
        defaultOpen: false,
        items: [
            {
                title: "Planes alimentarios",
                href: "/dashboard/planes",
                icon: UtensilsCrossed,
                permission: "plans:read",
            },
            {
                title: "Recetas",
                href: "/dashboard/recetas",
                icon: ChefHat,
                permission: "recipes:read",
            },
            {
                title: "Listas de compras",
                href: "/dashboard/listas-compras",
                icon: ShoppingCart,
                permission: "plans:read",
            },
        ],
    },
    {
        groupTitle: "Administración",
        defaultOpen: false,
        items: [
            {
                title: "Cobros",
                href: "/dashboard/cobros",
                icon: DollarSign,
                permission: "payments:read",
            },
            {
                title: "Gastos",
                href: "/dashboard/gastos",
                icon: TrendingDown,
                permission: "expenses:read",
            },
            {
                title: "Reportes",
                href: "/dashboard/reportes",
                icon: BarChart3,
                permission: "reports:read",
            },
        ],
    },
    {
        groupTitle: "Configuración",
        defaultOpen: false,
        items: [
            {
                title: "Usuarios",
                href: "/dashboard/users",
                icon: Users,
                permission: "users:read",
            },
            {
                title: "Roles",
                href: "/dashboard/roles",
                icon: Shield,
                requiresAdmin: true,
            },
        ],
    },
];

export function AppSidebar({
    className,
    onNavigate,
    userPermissions = [],
    isAdmin = false,
}: {
    className?: string;
    onNavigate?: () => void;
    userPermissions?: string[];
    isAdmin?: boolean;
}) {
    const pathname = usePathname();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    const filteredGroups = sidebarGroups.map(group => {
        const filteredItems = group.items
            .filter((item) => {
                if (item.requiresAdmin) return isAdmin;
                if (!item.permission) return true;
                return userPermissions.includes(item.permission);
            })
            .map((item) => {
                if (item.href === "/dashboard/users" && !isAdmin) {
                    return { ...item, title: "Mi Cuenta" };
                }
                return item;
            });

        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    const allFilteredItems = filteredGroups.flatMap(g => g.items);

    useEffect(() => {
        const initialState: Record<string, boolean> = {};
        filteredGroups.forEach(group => {
            const hasActiveItem = group.items.some(item => {
                if (item.href === "/dashboard") return pathname === "/dashboard";
                return pathname === item.href || pathname.startsWith(`${item.href}/`);
            });
            initialState[group.groupTitle] = hasActiveItem || group.defaultOpen || false;
        });
        setOpenGroups(initialState);
    }, [pathname]);

    const toggleGroup = (groupTitle: string) => {
        const group = filteredGroups.find(g => g.groupTitle === groupTitle);
        if (!group) return;

        const hasActiveItem = group.items.some(item => {
            if (item.href === "/dashboard") return pathname === "/dashboard";
            return pathname === item.href || pathname.startsWith(`${item.href}/`);
        });

        if (hasActiveItem && openGroups[groupTitle]) {
            return;
        }

        setOpenGroups(prev => ({
            ...prev,
            [groupTitle]: !prev[groupTitle],
        }));
    };

    return (
        <aside className={cn("w-64 bg-card flex flex-col h-full overflow-y-auto border-r", className)}>
            <div className="p-5 border-b flex items-center gap-2 sticky top-0 bg-card z-10">
                <Stethoscope className="h-5 w-5 text-primary" />
                <div>
                    <h2 className="font-bold text-sm tracking-tight leading-none">Mauro Acosta</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gestión nutricional</p>
                </div>
            </div>

            <nav aria-label="Navegación principal" className="flex-1 px-3 py-3 space-y-1">
                {filteredGroups.map((group) => {
                    const isOpen = !!openGroups[group.groupTitle];
                    const isPrincipal = group.groupTitle === "Principal";

                    if (isPrincipal) {
                        return (
                            <div key={group.groupTitle} className="space-y-0.5">
                                {group.items.map((item) => (
                                    <SidebarLink
                                        key={item.href}
                                        item={item}
                                        pathname={pathname}
                                        allFilteredItems={allFilteredItems}
                                        onNavigate={onNavigate}
                                    />
                                ))}
                            </div>
                        );
                    }

                    return (
                        <div key={group.groupTitle} className="space-y-0.5">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.groupTitle)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-bold tracking-tight transition-colors",
                                    "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}
                            >
                                <span>{group.groupTitle}</span>
                                {isOpen ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                )}
                            </button>

                            {isOpen && (
                                <div className="space-y-0.5 pl-1">
                                    {group.items.map((item) => (
                                        <SidebarLink
                                            key={item.href}
                                            item={item}
                                            pathname={pathname}
                                            allFilteredItems={allFilteredItems}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
            <div className="p-3 border-t text-xs text-center text-muted-foreground sticky bottom-0 bg-card">
                v1.0 — Consultorio nutricional
            </div>
        </aside>
    );
}

function SidebarLink({
    item,
    pathname,
    allFilteredItems,
    onNavigate,
}: {
    item: SidebarItem;
    pathname: string;
    allFilteredItems: SidebarItem[];
    onNavigate?: () => void;
}) {
    if (item.href === "/dashboard") {
        const isActive = pathname === "/dashboard";
        return (
            <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-xs font-medium",
                    isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.title}</span>
            </Link>
        );
    }

    const isExactMatch = pathname === item.href;
    const isChildRoute =
        pathname.startsWith(`${item.href}/`) &&
        !allFilteredItems.some(
            (otherItem) =>
                otherItem.href !== item.href &&
                otherItem.href.startsWith(item.href) &&
                pathname.startsWith(otherItem.href)
        );
    const isActive = isExactMatch || isChildRoute;

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.title}
        </Link>
    );
}
