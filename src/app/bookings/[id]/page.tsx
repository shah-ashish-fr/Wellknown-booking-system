import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Plus,
  User,
  BedDouble,
  Ban,
  MessageSquare,
  ExternalLink,
  Edit2,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { PaymentStatus, BookingSource, BookingStatus } from "@/types/booking";
import { formatDate, formatDateWithWeekday, formatCurrency, formatGuestFullName } from "@/lib/formatters";
import { getHotelContactInfo } from "@/lib/whatsapp-templates";
import { parseRoomAllocations } from "@/lib/room-allocations";
import BookingDetailsActions from "./booking-details-actions";
import WhatsAppMessageGenerator from "./whatsapp-message-generator";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingDetailsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const isNewlyCreated = sParams.created === "true";
  const isUpdated = sParams.updated === "true";

  // Fetch booking from PostgreSQL
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id }, { bookingId: id }],
    },
    include: {
      hotel: true,
    },
  });

  if (!booking) {
    notFound();
  }

  // Calculate stay nights
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const grandTotal = booking.totalAmount + booking.gstAmount;
  const balanceDue = Math.max(0, grandTotal - booking.advanceAmount);
  const isCancelled = booking.status === BookingStatus.CANCELLED;
  const guestDisplayName = formatGuestFullName(booking.guestTitle, booking.guestName);
  const roomAllocations = parseRoomAllocations(booking.roomAllocations, booking.roomType, booking.rooms);

  const bookingTemplateData = {
    bookingId: booking.bookingId,
    guestTitle: booking.guestTitle,
    guestName: guestDisplayName,
    guestPhone: booking.guestPhone,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    adults: booking.adults,
    children: booking.children,
    rooms: booking.rooms,
    roomType: booking.roomType,
    roomAllocations,
    totalAmount: booking.totalAmount,
    gstAmount: booking.gstAmount,
    advanceAmount: booking.advanceAmount,
    paymentStatus: booking.paymentStatus,
    bookingSource: booking.bookingSource,
    travelAgent: booking.travelAgent,
    status: booking.status,
    notes: booking.notes,
    hotel: {
      name: booking.hotel.name,
      location: booking.hotel.location,
    },
  };

  const hotelContacts = getHotelContactInfo(booking.hotel.name, booking.hotel.location);

  const getStatusBadge = (status: BookingStatus) => {
    if (status === BookingStatus.CANCELLED) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Confirmed
      </span>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.FULLY_PAID:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Fully Paid
          </span>
        );
      case PaymentStatus.ADVANCE_PAID:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Advance Paid
          </span>
        );
      case PaymentStatus.ADVANCE_PAYMENT_DUE:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-800">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
            Advance Payment Due
          </span>
        );
      case PaymentStatus.REFUNDED:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            Refunded
          </span>
        );
      case PaymentStatus.PENDING:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Pending Payment
          </span>
        );
    }
  };

  const getSourceBadge = (source: BookingSource) => {
    switch (source) {
      case BookingSource.WHATSAPP:
        return (
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            WhatsApp
          </span>
        );
      case BookingSource.PHONE:
        return (
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-200">
            Phone Call
          </span>
        );
      case BookingSource.WEBSITE:
        return (
          <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 border border-violet-200">
            Website
          </span>
        );
      case BookingSource.OFFLINE:
        return (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
            Walk-in
          </span>
        );
      case BookingSource.TRAVEL_AGENT:
        return (
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
            Travel Agent
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
            {source}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Navigation & Prominent Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Bookings</span>
        </Link>

        {/* PROMINENT TOP ACTIONS: WhatsApp Guest, WhatsApp Hotel, Edit Booking */}
        <div className="flex flex-wrap items-center gap-2.5">
          <WhatsAppMessageGenerator booking={bookingTemplateData} />

          <Link
            href={`/bookings/${booking.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors min-h-[42px]"
          >
            <Edit2 className="h-4 w-4 text-slate-500" />
            <span>Edit Booking</span>
          </Link>

          <BookingDetailsActions
            id={booking.id}
            bookingId={booking.bookingId}
            guestName={guestDisplayName}
            status={booking.status}
            includeInExcel={booking.includeInExcel !== false}
          />
        </div>
      </div>

      {/* Success Notification if newly created */}
      {isNewlyCreated && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Booking successfully created!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Saved with Booking ID: <span className="font-mono font-bold">{booking.bookingId}</span>. Use the buttons above to send confirmations via WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification if updated */}
      {isUpdated && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Booking updated successfully!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              All modifications have been saved.
            </p>
          </div>
        </div>
      )}

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-xs">
          <Ban className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">This reservation is currently cancelled</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              {booking.cancelledAt && `Cancelled on ${formatDate(booking.cancelledAt)}.`}
              {booking.cancellationReason && ` Reason: "${booking.cancellationReason}".`}
            </p>
          </div>
        </div>
      )}

      {/* Primary Header Card with Title and Key Summary */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              {booking.bookingId}
            </span>
            {booking.includeInExcel === false && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Excel: Excluded
              </span>
            )}
            {getStatusBadge(booking.status)}
            {getPaymentStatusBadge(booking.paymentStatus)}
            {getSourceBadge(booking.bookingSource)}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {guestDisplayName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{booking.hotel.name}</span>
            <span className="text-slate-300">•</span>
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{booking.hotel.location}</span>
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end justify-center rounded-xl bg-slate-50 p-4 border border-slate-100 sm:min-w-[200px]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Total Reservation Price
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {formatCurrency(grandTotal)}
          </span>
          <span className="text-xs font-medium mt-0.5">
            {balanceDue > 0 ? (
              <span className="text-amber-700">Due: {formatCurrency(balanceDue)} at check-in</span>
            ) : (
              <span className="text-emerald-700">Fully Settled</span>
            )}
          </span>
        </div>
      </div>

      {/* 2x2 Clean Information Hierarchy Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Guest Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Guest Information</h2>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Primary Guest Name
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-900">{guestDisplayName}</p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Contact Phone / WhatsApp
              </span>
              {booking.guestPhone ? (
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a
                    href={`tel:${booking.guestPhone.replace(/\s+/g, "")}`}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    {booking.guestPhone}
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-slate-400 italic">No phone number recorded</p>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Booking Channel
              </span>
              <p className="mt-1 font-medium text-slate-800">
                {booking.bookingSource === BookingSource.TRAVEL_AGENT
                  ? `Travel Agent${booking.travelAgent ? ` (${booking.travelAgent})` : ""}`
                  : booking.bookingSource}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Include in Excel
              </span>
              <div className="mt-1 flex items-center gap-2">
                {booking.includeInExcel !== false ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Yes (Included in Excel reports)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    No (Excel: Excluded)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Stay & Room Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Stay Information</h2>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              {nights} {nights === 1 ? "Night" : "Nights"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Check-In
              </span>
              <p className="mt-1 font-bold text-slate-900">{formatDateWithWeekday(booking.checkIn)}</p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Check-Out
              </span>
              <p className="mt-1 font-bold text-slate-900">{formatDateWithWeekday(booking.checkOut)}</p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Rooms Allocated
              </span>
              <p className="mt-1 font-bold text-slate-900">
                {booking.rooms} {booking.rooms === 1 ? "Room" : "Rooms"}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                {roomAllocations.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-400">•</span>
                    <span>{a.count} × {a.roomType}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Guests
              </span>
              <p className="mt-1 font-medium text-slate-800">
                {booking.adults} {booking.adults === 1 ? "Adult" : "Adults"}
              </p>
              {booking.children > 0 && (
                <p className="text-xs text-slate-500">{booking.children} Children</p>
              )}
            </div>
          </div>

          {hotelContacts?.mapsUrl && (
            <div className="pt-2 border-t border-slate-100">
              <a
                href={hotelContacts.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Google Maps Property Location</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Card 3: Payment Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Payment Information</h2>
            </div>
            {getPaymentStatusBadge(booking.paymentStatus)}
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Base Room Total:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</span>
            </div>

            {booking.gstAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">GST / Taxes:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(booking.gstAmount)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-slate-900">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
              <span>Advance Received:</span>
              <span className="font-bold">{formatCurrency(booking.advanceAmount)}</span>
            </div>

            <div className="flex justify-between py-1 pt-2 text-sm font-bold">
              <span>Balance Due at Check-In:</span>
              <span className={balanceDue > 0 ? "text-amber-800" : "text-emerald-700"}>
                {balanceDue > 0 ? formatCurrency(balanceDue) : "Nil (Settled)"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Notes & Hotel Desk Contacts */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Special Notes &amp; Desk Contacts</h2>
          </div>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Notes / Guest Requests
            </span>
            {booking.notes && booking.notes.trim() ? (
              <p className="mt-1 text-xs sm:text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {booking.notes.trim()}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400 italic">No special notes recorded</p>
            )}
          </div>

          {hotelContacts && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Front-Desk Numbers ({booking.hotel.name})
              </span>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Primary: <strong>{hotelContacts.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Desk / Emergency: <strong>{hotelContacts.reception}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
