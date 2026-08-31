import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { PatientNav } from "@/components/patient-portal/patient-nav";
import { PatientMobileMenu } from "@/components/patient-portal/patient-mobile-menu";
import { ReminderTrigger } from "@/components/reminder-trigger";
import { patientService } from "@/services/patient-service";
import { PatientChatDrawer } from "@/components/patient-portal/patient-chat-drawer";

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
    const patient = await patientService.getByUserId(user.id);

    return (
        <div className="min-h-screen bg-[#fafaf8] flex">
            <ReminderTrigger />
            {patient && <PatientChatDrawer />}
            <PatientNav userName={user.firstName || user.email} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="border-b border-[rgba(0,0,0,0.06)] bg-white sticky top-0 z-20">
                    <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
                        {/* Icono de la web en vez del texto */}
                        <Image
                            src="/images/iconMauroAcosta.png"
                            alt="Mauro Acosta"
                            width={688}
                            height={363}
                            className="md:hidden h-7 w-auto shrink-0"
                        />
                        <div className="flex items-center gap-1.5 md:ml-auto ml-auto">
                            <LogoutButton userName={user.firstName || user.email} />
                            {/* Menu al final */}
                            <div className="md:hidden">
                                <PatientMobileMenu userName={user.firstName || user.email} />
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
