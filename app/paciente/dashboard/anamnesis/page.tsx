import { getMyAnamnesis, saveMyAnamnesis } from "@/app/actions/patient-portal";
import { AnamnesisForm } from "@/components/anamnesis/anamnesis-form";

export const metadata = { title: "Mi anamnesis — Mauro Acosta" };

export default async function PatientAnamnesisPage() {
  const anamnesis = await getMyAnamnesis();
  return <div className="space-y-6"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Mi información</p><h1 className="text-2xl font-semibold tracking-tight">Anamnesis nutricional</h1><p className="mt-1 text-sm text-muted-foreground">Completá estos datos para que tu plan sea más personalizado.</p></div><AnamnesisForm patientId="self" initialData={anamnesis as any} patientMode onSave={saveMyAnamnesis} /></div>;
}
