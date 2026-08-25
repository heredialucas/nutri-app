import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = {
    title: "Mi Portal — Mauro Acosta",
    description: "Portal del paciente — Mauro Acosta",
};

export default async function PacienteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const isPatient = isPatientUser(user);
    if (!isPatient) redirect("/dashboard");

    return (
        <div className="min-h-screen bg-[#fafaf8]">
            <header className="border-b border-[rgba(0,0,0,0.06)] bg-white sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-baseline gap-1 text-base font-semibold no-underline text-[#1a1a1a]">
                        <span>Mauro</span>
                        <span className="text-[rgba(0,0,0,0.3)]">Acosta</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#666] hidden sm:block">
                            {user.firstName || user.email}
                        </span>
                        <LogoutButton />
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </div>
    );
}
