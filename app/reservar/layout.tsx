import BookingLayoutInner from "./booking-layout-inner";

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookingLayoutInner>{children}</BookingLayoutInner>;
}
