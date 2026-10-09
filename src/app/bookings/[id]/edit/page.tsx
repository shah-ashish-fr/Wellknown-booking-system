import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/db";
import EditBookingForm from "./edit-booking-form";

export const metadata = {
  title: "Edit Booking | WellKnown Booking",
  description: "Update hotel booking details",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookingPage({ params }: PageProps) {
  const { id } = await params;

  const [booking, hotels] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingId: id }],
      },
    }),
    prisma.hotel.findMany({
      select: { id: true, name: true, location: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!booking) {
    notFound();
  }

  // Format dates into YYYY-MM-DD for standard HTML input elements
  const checkInStr = booking.checkIn.toISOString().split("T")[0];
  const checkOutStr = booking.checkOut.toISOString().split("T")[0];

  const initialData = {
    hotelId: booking.hotelId,
    guestTitle: booking.guestTitle || "",
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    bookingId: booking.bookingId,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    adults: booking.adults,
    children: booking.children,
    rooms: booking.rooms,
    roomType: booking.roomType,
    roomAllocations: booking.roomAllocations as any,
    totalAmount: booking.totalAmount,
    gstAmount: booking.gstAmount,
    advanceAmount: booking.advanceAmount,
    paymentStatus: booking.paymentStatus,
    bookingSource: booking.bookingSource,
    travelAgent: booking.travelAgent || "",
    includeInExcel: booking.includeInExcel !== false,
    notes: booking.notes || "",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <div>
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Booking Details
        </Link>
      </div>

      <PageHeader
        title={`Edit Booking (${booking.bookingId})`}
        description={`Update reservation details for guest ${booking.guestName}`}
      />

      <EditBookingForm id={booking.id} hotels={hotels} initialData={initialData} />
    </div>
  );
}
