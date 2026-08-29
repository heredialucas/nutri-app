import { getMyProfile } from "@/app/actions/patient-portal";
import { ProfileForm } from "@/components/patient-portal/profile-form";

export const metadata = {
    title: "Mis datos — Mauro Acosta",
    description: "Editá tus datos personales — Mauro Acosta",
};

export default async function PerfilPage() {
    const profile = await getMyProfile();

    const initial = {
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        birthDate: profile.birthDate
            ? String(profile.birthDate).split("T")[0]
            : "",
        billingType: profile.billingType || "particular",
        gender: profile.gender ?? "",
        documentNumber: profile.documentNumber ?? "",
        city: profile.city ?? "",
        address: profile.address ?? "",
        occupation: profile.occupation ?? "",
        healthInsurance: profile.healthInsurance ?? "",
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1 m-0">
                Mis datos
            </h1>
            <p className="text-sm text-[#666] mb-8 m-0">
                Mantené tu información actualizada. El teléfono se usa para
                gestionar tus turnos.
            </p>

            <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                <ProfileForm profile={initial} />
            </div>
        </div>
    );
}