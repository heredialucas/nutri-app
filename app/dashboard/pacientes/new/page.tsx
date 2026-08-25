import { PatientForm } from "@/components/patients/patient-form";

export const metadata = {
    title: "Nuevo paciente",
    description: "Registrar un nuevo paciente",
};

export default function NewPatientPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Nuevo paciente</h1>
                <p className="text-muted-foreground text-sm">
                    Completá los datos para registrar un nuevo paciente
                </p>
            </div>
            <PatientForm mode="create" />
        </div>
    );
}
