import { getPatients } from "@/app/actions/patients";
import { PatientList } from "@/components/patients/patient-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Pacientes",
    description: "Gestión de pacientes",
};

export default async function PatientsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const { tab } = await searchParams;
    const isTrashed = tab === "trashed";
    const patients = await getPatients({ trashed: isTrashed });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
                    <p className="text-muted-foreground text-sm">
                        {patients.length} paciente{patients.length !== 1 ? "s" : ""} {isTrashed ? "eliminado" : "registrado"}{patients.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/pacientes/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Nuevo paciente
                    </Link>
                </Button>
            </div>
            <PatientList initialPatients={patients as any} defaultTab={isTrashed ? "trashed" : "all"} />
        </div>
    );
}
