"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PatientNavLinks } from "@/components/patient-portal/patient-nav-links";

export function PatientNav({ userName }: { userName?: string }) {
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
            {/* Sidebar de escritorio (oculto en mobile, ahí se usa el drawer) */}
            <aside className={cn(
                "hidden md:flex flex-col shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-white h-screen sticky top-0 transition-[width] duration-200 ease-in-out overflow-hidden z-10",
                isCollapsed ? "w-16" : "w-56",
            )}>
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

                <PatientNavLinks collapsed={isCollapsed} />

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