import { getCurrentPatientData } from "@/app/actions/current-patient";
import BookingLayoutClient from "@/components/booking/booking-layout-client";

export default async function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedPatient = await getCurrentPatientData();
  return (
    <BookingLayoutClient loggedPatient={loggedPatient}>
      {children}
    </BookingLayoutClient>
  );
}
