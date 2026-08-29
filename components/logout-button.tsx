"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function LogoutButton({ userName }: { userName?: string }) {
    const handleLogout = async () => {
        await logoutAction();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                    className={cn(
                        "inline-flex items-center gap-2 text-xs text-[#666] hover:text-[#1a1a1a] transition-colors cursor-pointer bg-transparent border-none p-0"
                    )}
                >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] text-white text-xs font-bold shrink-0">
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </span>
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium leading-none">{userName || "Mi cuenta"}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}