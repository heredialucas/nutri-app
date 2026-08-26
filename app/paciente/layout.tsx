import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { PatientNav } from "@/components/patient-portal/patient-nav";
import { ReminderTrigger } from "@/components/reminder-trigger";

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
        <div className="min-h-screen bg-[#fafaf8] flex">
            <ReminderTrigger />
            <PatientNav userName={user.firstName || user.email} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="border-b border-[rgba(0,0,0,0.06)] bg-white sticky top-0 z-10">
                    <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-end">
                        <LogoutButton />
                    </div>
                </header>
                <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
