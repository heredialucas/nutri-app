import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { getPatientFiles } from "@/app/actions/files";
import { FileUpload } from "@/components/files/file-upload";
import { FileList } from "@/components/files/file-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Archivos",
};

export default async function PatientFilesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    let patient: any;
    try {
        patient = await getPatientById(id);
    } catch {
        notFound();
    }

    const files = await getPatientFiles(id).catch(() => []);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={`/dashboard/pacientes/${id}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al paciente
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">
                    Archivos — {patient.firstName} {patient.lastName}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Subir archivo</CardTitle>
                </CardHeader>
                <CardContent>
                    <FileUpload patientId={id} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Archivos ({files.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <FileList files={files as any} />
                </CardContent>
            </Card>
        </div>
    );
}
