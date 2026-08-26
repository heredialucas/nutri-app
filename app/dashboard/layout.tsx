import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AppSidebar } from "@/components/app-sidebar";
import { Suspense } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ReminderTrigger } from "@/components/reminder-trigger";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Panel de gestión nutricional — Mauro Acosta",
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // getCurrentUser usa React.cache(): se ejecuta una sola vez por request
    // aunque sea llamado desde múltiples Server Components
    const user = await getCurrentUser();

    const userPermissions: string[] =
        user?.userRoles?.flatMap((ur) =>
            ur.role.permissions.map((rp) => rp.permission.action)
        ) ?? [];

    // Usa función tipada en lugar de (ur: any)
    const isAdmin = isAdminUser(user);

    return (
        <div className="min-h-screen flex text-foreground bg-background">
            <ReminderTrigger />
            {/* Desktop Sidebar */}
            <AppSidebar
                className="hidden md:flex border-r sticky top-0 h-screen"
                userPermissions={userPermissions}
                isAdmin={isAdmin}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-16 items-center gap-2 px-4 md:px-6">
                        {/* Mobile Navigation */}
                        <MobileNav userPermissions={userPermissions} isAdmin={isAdmin} />

                        {/* Desktop Empty Space */}
                        <div className="hidden md:block" />

                        <div className="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
                            {/* Skeleton correctamente usando el componente de shadcn */}
                            <Suspense fallback={<Skeleton className="h-8 w-24 rounded-md" />}>
                                <AuthButton />
                            </Suspense>
                            <ThemeSwitcher />
                        </div>
                    </div>
                </header>

                {/* id="main-content" es el destino del skip link de accesibilidad */}
                <main id="main-content" className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
