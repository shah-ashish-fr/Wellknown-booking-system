import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/db";
import BookingForm from "./booking-form";

export const metadata = {
  title: "New Booking | WellKnown Booking",
  description: "Create and register a new hotel booking",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewBookingPage({ searchParams }: PageProps) {
  const sParams = await searchParams;
  const preselectedHotelId = typeof sParams?.hotelId === "string" ? sParams.hotelId : undefined;

  // Fetch hotels directly from PostgreSQL
  let hotels: { id: string; name: string; location: string }[] = [];
  try {
    hotels = await prisma.hotel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, location: true },
    });
  } catch (error) {
    console.error("Failed to load hotels from database:", error);
  }

  // Deterministic initial values generated on server to ensure 100% hydration match
  const selectedOrFirst = (preselectedHotelId && hotels.find((h) => h.id === preselectedHotelId)) || hotels[0];
  const prefix = selectedOrFirst ? selectedOrFirst.name.slice(0, 3).toUpperCase() : "WK";
  const now = new Date();
  const dateStr = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomNum = (now.getTime() % 9000) + 1000;
  const initialBookingId = `${prefix}-${dateStr}-${randomNum}`;
  const initialCheckIn = now.toISOString().split("T")[0];
  const initialCheckOut = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Link>
      </div>

      <PageHeader
        title="Create New Booking"
        description="Enter the booking details received via WhatsApp or other channels"
      />

      <BookingForm
        hotels={hotels}
        initialBookingId={initialBookingId}
        initialCheckIn={initialCheckIn}
        initialCheckOut={initialCheckOut}
        defaultHotelId={preselectedHotelId}
      />
    </div>
  );
}
