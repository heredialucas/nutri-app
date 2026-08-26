"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
    PanelLeftClose,
    PanelLeftOpen,
    MessageSquare,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
            {
                title: "WhatsApp",
                href: "/dashboard/configuracion/whatsapp",
                icon: MessageSquare,
            },
        ],
    },
];

export function AppSidebar({
    className,
    onNavigate,
    userPermissions = [],
    isAdmin = false,
    forceExpanded = false,
}: {
    className?: string;
    onNavigate?: () => void;
    userPermissions?: string[];
    isAdmin?: boolean;
    forceExpanded?: boolean;
}) {
    const pathname = usePathname();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (forceExpanded) return;
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) setCollapsed(saved === "true");
    }, [forceExpanded]);

    const toggleCollapsed = useCallback(() => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem("sidebar-collapsed", String(next));
            return next;
        });
    }, []);

    const isCollapsed = forceExpanded ? false : collapsed;

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
        <TooltipProvider delayDuration={0}>
            <aside className={cn(
                "bg-card flex flex-col h-full overflow-y-auto border-r transition-[width] duration-200 ease-in-out shrink-0",
                isCollapsed ? "w-16" : "w-64",
                className,
            )}>
                <div className={cn(
                    "h-16 border-b flex items-center sticky top-0 bg-card z-10 shrink-0",
                    isCollapsed ? "justify-center px-0" : "px-5 gap-2",
                )}>
                    <Stethoscope className="h-5 w-5 text-primary shrink-0" />
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <h2 className="font-bold text-sm tracking-tight leading-none">Mauro Acosta</h2>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Gestión nutricional</p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        className={cn(
                            "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0",
                            isCollapsed ? "mt-3" : "ml-auto",
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

            <nav aria-label="Navegación principal" className={cn("flex-1 py-3 space-y-1", isCollapsed ? "px-2" : "px-3")}>
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
                                        collapsed={isCollapsed}
                                    />
                                ))}
                            </div>
                        );
                    }

                    if (isCollapsed) {
                        return (
                            <div key={group.groupTitle} className="space-y-0.5">
                                {group.items.map((item) => (
                                    <SidebarLink
                                        key={item.href}
                                        item={item}
                                        pathname={pathname}
                                        allFilteredItems={allFilteredItems}
                                        onNavigate={onNavigate}
                                        collapsed={isCollapsed}
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
                                            collapsed={isCollapsed}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
            <div className={cn(
                "border-t text-muted-foreground sticky bottom-0 bg-card shrink-0",
                isCollapsed ? "p-2 text-[0]" : "p-3 text-xs text-center",
            )}>
                {isCollapsed ? (
                    <Stethoscope className="h-4 w-4 mx-auto text-muted-foreground/50" />
                ) : (
                    "v1.0 — Consultorio nutricional"
                )}
            </div>
        </aside>
        </TooltipProvider>
    );
}

function SidebarLink({
    item,
    pathname,
    allFilteredItems,
    onNavigate,
    collapsed,
}: {
    item: SidebarItem;
    pathname: string;
    allFilteredItems: SidebarItem[];
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    const isExactMatch = pathname === item.href;
    const isChildRoute =
        pathname.startsWith(`${item.href}/`) &&
        !allFilteredItems.some(
            (otherItem) =>
                otherItem.href !== item.href &&
                otherItem.href.startsWith(item.href) &&
                pathname.startsWith(otherItem.href)
        );
    const isActive = item.href === "/dashboard"
        ? pathname === "/dashboard"
        : isExactMatch || isChildRoute;

    const link = (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 rounded-md text-xs font-medium transition-colors",
                collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.title}</span>}
        </Link>
    );

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {link}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                </TooltipContent>
            </Tooltip>
        );
    }

    return link;
}
