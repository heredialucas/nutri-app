import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { patientService } from "@/services/patient-service";
import prisma from "@/lib/prisma";
import { FolderOpen, FileText, Image, Download, ExternalLink } from "lucide-react";

const categoryLabels: Record<string, string> = {
    lab: "Análisis clínicos",
    image: "Imágenes",
    document: "Documentos",
    consent: "Consentimientos",
    other: "Otros",
};

const mimeTypeIcons: Record<string, typeof FileText> = {
    "application/pdf": FileText,
    "image/jpeg": Image,
    "image/png": Image,
    "image/webp": Image,
};

export default async function ArchivosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (!isPatientUser(user)) redirect("/dashboard");

    const patient = await patientService.getByUserId(user.id);
    if (!patient) redirect("/auth/login");

    const files = await prisma.patientFile.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: "desc" },
    });

    // Group by category
    const grouped = files.reduce((acc: Record<string, any[]>, file: any) => {
        const cat = file.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(file);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">Mis archivos</h1>
            <p className="text-sm text-[#666] mb-6 m-0">Documentos, análisis y consentimientos</p>

            {files.length === 0 ? (
                <div className="text-center py-12">
                    <FolderOpen size={36} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-[#1a1a1a] mb-1 m-0">
                        Sin archivos
                    </h2>
                    <p className="text-sm text-[#666] m-0">
                        Mauro Acosta subirá tus archivos desde el panel profesional.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([category, categoryFiles]) => (
                        <section key={category}>
                            <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3 m-0 uppercase tracking-wide">
                                {categoryLabels[category] || category}
                            </h2>
                            <div className="space-y-2">
                                {categoryFiles.map((file: any) => {
                                    const Icon = mimeTypeIcons[file.mimeType || ""] || FileText;
                                    const date = new Date(file.createdAt).toLocaleDateString("es-AR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    });
                                    const sizeKB = file.size ? Math.round(file.size / 1024) : null;

                                    return (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-[rgba(0,0,0,0.03)] flex items-center justify-center shrink-0">
                                                <Icon size={16} className="text-[#666]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-[#1a1a1a] block truncate">
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-[#999]">
                                                    {date}{sizeKB ? ` · ${sizeKB} KB` : ""}
                                                </span>
                                            </div>
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#666] hover:bg-[rgba(0,0,0,0.04)] transition-colors shrink-0"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
