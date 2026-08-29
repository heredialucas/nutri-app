"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PatientNavLinks } from "@/components/patient-portal/patient-nav-links";

export function PatientMobileMenu({ userName }: { userName?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="Abrir menú de navegación">
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
                <VisuallyHidden>
                    <SheetTitle>Menú de navegación</SheetTitle>
                    <SheetDescription>Navegación principal del paciente</SheetDescription>
                </VisuallyHidden>
                <div className="h-14 px-4 flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)] shrink-0">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1a1a1a] text-white font-bold text-[11px] tracking-tight shrink-0">
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </span>
                    <span className="text-sm font-medium text-[#1a1a1a] truncate">
                        {userName || "Mi cuenta"}
                    </span>
                </div>
                <PatientNavLinks onNavigate={() => setOpen(false)} className="flex-1" />
                <div className="p-3 border-t border-[rgba(0,0,0,0.06)] shrink-0 mt-auto">
                    <Image
                        src="/images/iconMauroAcosta.png"
                        alt="Mauro Acosta"
                        width={688}
                        height={363}
                        className="h-7 w-auto mx-auto opacity-70"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}