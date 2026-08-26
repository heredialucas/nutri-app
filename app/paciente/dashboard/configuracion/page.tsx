import { WhatsAppSettingsForm } from "@/components/whatsapp-settings-form";

export default function PatientWhatsAppConfigPage() {
    return (
        <div className="max-w-lg mx-auto">
            <WhatsAppSettingsForm role="PATIENT" />
        </div>
    );
}
