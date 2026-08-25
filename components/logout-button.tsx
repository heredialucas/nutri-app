"use client";

import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    return (
        <button
            onClick={() => logoutAction()}
            className="inline-flex items-center gap-1.5 text-xs text-[#666] hover:text-[#1a1a1a] transition-colors cursor-pointer bg-transparent border-none p-0"
        >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
        </button>
    );
}
