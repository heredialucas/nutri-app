"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AppSidebar } from "@/components/app-sidebar";

export function MobileNav({ 
    userPermissions = [],
    isAdmin = false,
}: { 
    userPermissions?: string[];
    isAdmin?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center gap-2 min-w-0">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0" aria-label="Abrir menú de navegación">
                        <Menu className="h-5 w-5" aria-hidden="true" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <VisuallyHidden>
                        <SheetTitle>Menú de navegación</SheetTitle>
                        <SheetDescription>Navegación principal del dashboard</SheetDescription>
                    </VisuallyHidden>
                    <AppSidebar
                        className="h-full border-none"
                        onNavigate={() => setOpen(false)}
                        userPermissions={userPermissions}
                        isAdmin={isAdmin}
                        forceExpanded
                    />
                </SheetContent>
            </Sheet>
            <div className="font-bold truncate text-sm">Mauro Acosta</div>
        </div>
    );
}
