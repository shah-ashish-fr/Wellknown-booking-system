import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/db";
import { formatGuestFullName } from "@/lib/formatters";
import BookingsTable, { BookingRow } from "./bookings-table";

export const metadata = {
  title: "Bookings | WellKnown Booking",
  description: "View, search, filter, and manage all hotel bookings",
};

interface BookingWithHotel {
  id: string;
  bookingId: string;
  guestTitle?: string | null;
  guestName: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  rooms: number;
  roomType: string;
  adults: number;
  children: number;
  totalAmount: number;
  gstAmount: number;
  advanceAmount: number;
  paymentStatus: any;
  bookingSource: any;
  status: any;
  notes: string | null;
  includeInExcel?: boolean;
  createdAt: Date;
  hotel: {
    id: string;
    name: string;
    location: string;
  };
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const sParams = await searchParams;
  const initialHotel = typeof sParams?.hotel === "string" ? sParams.hotel : undefined;

  let bookings: BookingWithHotel[] = [];
  let hotels: { id: string; name: string }[] = [];

  try {
    [bookings, hotels] = await Promise.all([
      prisma.booking.findMany({
        include: {
          hotel: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.hotel.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (error) {
    console.error("Failed to load bookings data:", error);
  }

  // Serialize Date objects into ISO strings for client component
  const serializedBookings: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    bookingId: b.bookingId,
    guestName: formatGuestFullName(b.guestTitle, b.guestName),
    guestPhone: b.guestPhone,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    rooms: b.rooms,
    roomType: b.roomType,
    adults: b.adults,
    children: b.children,
    totalAmount: b.totalAmount,
    gstAmount: b.gstAmount,
    advanceAmount: b.advanceAmount,
    paymentStatus: b.paymentStatus,
    bookingSource: b.bookingSource,
    status: b.status,
    notes: b.notes,
    includeInExcel: b.includeInExcel !== false,
    createdAt: b.createdAt.toISOString(),
    hotel: {
      id: b.hotel.id,
      name: b.hotel.name,
      location: b.hotel.location,
    },
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Bookings Management"
        description="Search, filter, edit, and manage all guest reservations across Nathdwara, Saputara, and Dwarka"
      >
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking</span>
        </Link>
      </PageHeader>

      {/* Bookings Table with Search, Filters, and Actions */}
      {serializedBookings.length > 0 ? (
        <BookingsTable
          initialBookings={serializedBookings}
          hotels={hotels}
          initialHotelFilter={initialHotel}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Get started by recording your first guest reservation received via WhatsApp or phone.
          </p>
          <div className="mt-6">
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create First Booking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
