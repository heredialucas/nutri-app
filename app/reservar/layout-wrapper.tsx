import { getCurrentPatientData } from "@/app/actions/current-patient";
import BookingLayout from "./layout";

export default async function ReservarLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const patientData = await getCurrentPatientData();
    return (
        <BookingLayout loggedPatient={patientData}>
            {children}
        </BookingLayout>
    );
}
