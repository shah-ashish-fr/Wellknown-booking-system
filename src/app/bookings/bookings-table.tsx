"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  X,
  Eye,
  Edit2,
  Ban,
  RotateCcw,
  Phone,
  ArrowUpDown,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Calendar,
  Building2,
  BedDouble,
  Users,
} from "lucide-react";
import { PaymentStatus, BookingSource, BookingStatus } from "@/types/booking";
import { formatDateShort, formatCurrency, calculateNights } from "@/lib/formatters";
import { cancelBooking, restoreBooking } from "@/app/actions/booking";

export interface BookingRow {
  id: string;
  bookingId: string;
  guestName: string;
  guestPhone: string;
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  rooms: number;
  roomType: string;
  adults: number;
  children: number;
  totalAmount: number;
  gstAmount: number;
  advanceAmount: number;
  paymentStatus: PaymentStatus;
  bookingSource: BookingSource;
  status: BookingStatus;
  includeInExcel?: boolean;
  notes?: string | null;
  createdAt: string;
  hotel: {
    id: string;
    name: string;
    location: string;
  };
}

interface BookingsTableProps {
  initialBookings: BookingRow[];
  hotels: { id: string; name: string }[];
  initialHotelFilter?: string;
}

type SortField = "createdAt" | "checkIn" | "guestName" | "totalAmount";

export default function BookingsTable({
  initialBookings,
  hotels,
  initialHotelFilter,
}: BookingsTableProps) {
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [selectedHotel, setSelectedHotel] = useState<string>(initialHotelFilter || "ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<string>("ALL");
  const [checkInFrom, setCheckInFrom] = useState<string>("");
  const [checkInTo, setCheckInTo] = useState<string>("");

  // Sort state: newest first by default
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Cancellation Modal state
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter & Search Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Search Query: matches guestName, bookingId, or phone
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = b.guestName.toLowerCase().includes(q);
        const matchId = b.bookingId.toLowerCase().includes(q);
        const matchPhone = (b.guestPhone || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone) return false;
      }

      // 2. Hotel filter
      if (selectedHotel !== "ALL" && b.hotel.id !== selectedHotel) {
        return false;
      }

      // 3. Payment Status filter
      if (selectedPaymentStatus !== "ALL" && b.paymentStatus !== selectedPaymentStatus) {
        return false;
      }

      // 4. Booking Source filter
      if (selectedSource !== "ALL" && b.bookingSource !== selectedSource) {
        return false;
      }

      // 5. Booking Status (Confirmed vs Cancelled)
      if (selectedBookingStatus !== "ALL" && b.status !== selectedBookingStatus) {
        return false;
      }

      // 6. Check-in Date Range filter
      if (checkInFrom) {
        const bCheckIn = new Date(b.checkIn).toISOString().split("T")[0];
        if (bCheckIn < checkInFrom) return false;
      }
      if (checkInTo) {
        const bCheckIn = new Date(b.checkIn).toISOString().split("T")[0];
        if (bCheckIn > checkInTo) return false;
      }

      return true;
    });
  }, [
    bookings,
    searchQuery,
    selectedHotel,
    selectedPaymentStatus,
    selectedSource,
    selectedBookingStatus,
    checkInFrom,
    checkInTo,
  ]);

  // Sort Logic
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "checkIn") {
        comparison = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
      } else if (sortField === "guestName") {
        comparison = a.guestName.localeCompare(b.guestName);
      } else if (sortField === "totalAmount") {
        comparison = a.totalAmount + a.gstAmount - (b.totalAmount + b.gstAmount);
      }

      return sortAsc ? comparison : -comparison;
    });
  }, [filteredBookings, sortField, sortAsc]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedHotel !== "ALL" ||
    selectedPaymentStatus !== "ALL" ||
    selectedSource !== "ALL" ||
    selectedBookingStatus !== "ALL" ||
    checkInFrom !== "" ||
    checkInTo !== "";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedHotel("ALL");
    setSelectedPaymentStatus("ALL");
    setSelectedSource("ALL");
    setSelectedBookingStatus("ALL");
    setCheckInFrom("");
    setCheckInTo("");
    setSortField("createdAt");
    setSortAsc(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    const bookingIdToCancel = cancelModalBooking.id;

    startTransition(async () => {
      const res = await cancelBooking(bookingIdToCancel, cancelReason);
      if (res.success) {
        setBookings((prev) =>
          prev.map((item) =>
            item.id === bookingIdToCancel
              ? { ...item, status: BookingStatus.CANCELLED }
              : item
          )
        );
        setActionSuccess(`Booking "${cancelModalBooking.bookingId}" was cancelled.`);
        setCancelModalBooking(null);
        setCancelReason("");
        setTimeout(() => setActionSuccess(null), 4000);
      }
    });
  };

  const handleRestore = (booking: BookingRow) => {
    startTransition(async () => {
      const res = await restoreBooking(booking.id);
      if (res.success) {
        setBookings((prev) =>
          prev.map((item) =>
            item.id === booking.id
              ? { ...item, status: BookingStatus.CONFIRMED }
              : item
          )
        );
        setActionSuccess(`Booking "${booking.bookingId}" was restored to Confirmed.`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    });
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.FULLY_PAID:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Fully Paid
          </span>
        );
      case PaymentStatus.ADVANCE_PAID:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Advance Paid
          </span>
        );
      case PaymentStatus.ADVANCE_PAYMENT_DUE:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
            Advance Payment Due
          </span>
        );
      case PaymentStatus.REFUNDED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Refunded
          </span>
        );
      case PaymentStatus.PENDING:
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Pending
          </span>
        );
    }
  };

  const getSourceBadge = (source: BookingSource) => {
    switch (source) {
      case BookingSource.WHATSAPP:
        return (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
            WhatsApp
          </span>
        );
      case BookingSource.PHONE:
        return (
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200">
            Phone
          </span>
        );
      case BookingSource.WEBSITE:
        return (
          <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 border border-violet-200">
            Website
          </span>
        );
      case BookingSource.OFFLINE:
        return (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
            Walk-in
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
            {source}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{actionSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Search bar & Quick Counts */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, phone, or booking ID..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{sortedBookings.length}</span> of{" "}
              <span className="font-bold text-slate-900">{bookings.length}</span> bookings
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Dropdown Filters & Date Range */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-3 border-t border-slate-100 text-xs">
          {/* Hotel Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Hotel
            </label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Hotels (3)</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.ADVANCE_PAYMENT_DUE}>Advance Payment Due</option>
              <option value={PaymentStatus.ADVANCE_PAID}>Advance Paid</option>
              <option value={PaymentStatus.FULLY_PAID}>Fully Paid</option>
              <option value={PaymentStatus.REFUNDED}>Refunded</option>
            </select>
          </div>

          {/* Booking Source Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Sources</option>
              <option value={BookingSource.WHATSAPP}>WhatsApp</option>
              <option value={BookingSource.PHONE}>Phone Call</option>
              <option value={BookingSource.WEBSITE}>Website</option>
              <option value={BookingSource.OFFLINE}>Walk-in</option>
              <option value={BookingSource.OTHER}>Other</option>
            </select>
          </div>

          {/* Booking Status Filter (Active vs Cancelled) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Booking Status
            </label>
            <select
              value={selectedBookingStatus}
              onChange={(e) => setSelectedBookingStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All (Confirmed &amp; Cancelled)</option>
              <option value={BookingStatus.CONFIRMED}>Confirmed Only</option>
              <option value={BookingStatus.CANCELLED}>Cancelled Only</option>
            </select>
          </div>

          {/* Check-In Date Range */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Check-In Date Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={checkInFrom}
                onChange={(e) => setCheckInFrom(e.target.value)}
                aria-label="Check-in from date"
                className="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={checkInTo}
                onChange={(e) => setCheckInTo(e.target.value)}
                aria-label="Check-in to date"
                className="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. MOBILE VIEW: READABLE BOOKING CARDS (HIDDEN ON DESKTOP) */}
      <div className="md:hidden space-y-3">
        {sortedBookings.length > 0 ? (
          sortedBookings.map((b) => {
            const isCancelled = b.status === BookingStatus.CANCELLED;
            const grandTotal = b.totalAmount + b.gstAmount;
            const balanceDue = Math.max(0, grandTotal - b.advanceAmount);
            const nights = calculateNights(b.checkIn, b.checkOut);

            return (
              <div
                key={b.id}
                className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 transition-colors ${
                  isCancelled ? "bg-slate-50/70 opacity-80" : ""
                }`}
              >
                {/* Top Row: ID, Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isCancelled
                          ? "line-through text-slate-500"
                          : "text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
                      }`}
                    >
                      {b.bookingId}
                    </span>
                    {isCancelled && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                        Cancelled
                      </span>
                    )}
                    {b.includeInExcel === false && (
                      <span className="rounded bg-slate-100 border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        Excel: Excluded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getPaymentStatusBadge(b.paymentStatus)}
                    {getSourceBadge(b.bookingSource)}
                  </div>
                </div>

                {/* Guest & Phone */}
                <div>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 block"
                  >
                    {b.guestName}
                  </Link>
                  {b.guestPhone && (
                    <a
                      href={`tel:${b.guestPhone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 mt-0.5"
                    >
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{b.guestPhone}</span>
                    </a>
                  )}
                </div>

                {/* Hotel & Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-semibold">{b.hotel.name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 truncate">{b.hotel.location}</span>
                </div>

                {/* Stay & Room Details */}
                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Stay Dates
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatDateShort(b.checkIn)} &rarr; {formatDateShort(b.checkOut)}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {nights} {nights === 1 ? "Night" : "Nights"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Rooms &amp; Guests
                    </span>
                    <span className="font-medium text-slate-800">
                      {b.rooms} Room ({b.roomType})
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {b.adults} {b.adults === 1 ? "Adult" : "Adults"}
                      {b.children > 0 ? `, ${b.children} Ch.` : ""}
                    </span>
                  </div>
                </div>

                {/* Amount & Balance */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-500">Total: </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  <div className="text-right">
                    {balanceDue > 0 ? (
                      <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Due: {formatCurrency(balanceDue)}
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Fully Settled
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Touch-friendly */}
                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={`/bookings/${b.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[42px] rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Booking</span>
                  </Link>

                  <Link
                    href={`/bookings/${b.id}/edit`}
                    className="flex items-center justify-center min-h-[42px] px-3.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    aria-label="Edit booking"
                  >
                    <Edit2 className="h-4 w-4 text-slate-600" />
                  </Link>

                  {isCancelled ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(b)}
                      disabled={isPending}
                      className="flex items-center justify-center min-h-[42px] px-3.5 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      aria-label="Restore booking"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCancelModalBooking(b)}
                      className="flex items-center justify-center min-h-[42px] px-3.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      aria-label="Cancel booking"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center rounded-xl border border-slate-200 bg-white">
            <Filter className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No bookings found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query or filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. DESKTOP VIEW: CLEAN SEARCHABLE TABLE (HIDDEN ON MOBILE) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {sortedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    Booking ID
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort("guestName")}
                      className="inline-flex items-center gap-1 hover:text-slate-800 font-semibold"
                    >
                      Guest Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Hotel
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort("checkIn")}
                      className="inline-flex items-center gap-1 hover:text-slate-800 font-semibold"
                    >
                      Stay Dates
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Rooms
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort("totalAmount")}
                      className="inline-flex items-center gap-1 hover:text-slate-800 font-semibold"
                    >
                      Total Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Payment Status
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Source
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {sortedBookings.map((b) => {
                  const isCancelled = b.status === BookingStatus.CANCELLED;
                  const grandTotal = b.totalAmount + b.gstAmount;

                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isCancelled ? "bg-slate-50/60 opacity-75" : ""
                      }`}
                    >
                      {/* Booking ID & Cancelled pill */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/bookings/${b.id}`}
                              className={`font-mono text-xs font-bold ${
                                isCancelled
                                  ? "text-slate-400 line-through"
                                  : "text-indigo-600 hover:underline"
                              }`}
                            >
                              {b.bookingId}
                            </Link>
                            {isCancelled && (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                                Cancelled
                              </span>
                            )}
                          </div>
                          {b.includeInExcel === false && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Excel: Excluded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Guest Name & Phone */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{b.guestName}</div>
                        {b.guestPhone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="h-2.5 w-2.5 text-slate-400" />
                            <span>{b.guestPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Hotel */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-medium text-slate-800">{b.hotel.name}</div>
                        <div className="text-[11px] text-slate-400">{b.hotel.location}</div>
                      </td>

                      {/* Check-In / Out */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-medium text-slate-800">
                          {formatDateShort(b.checkIn)} - {formatDateShort(b.checkOut)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {calculateNights(b.checkIn, b.checkOut)} Nights
                        </div>
                      </td>

                      {/* Rooms */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        <div className="font-medium">
                          {b.rooms} {b.rooms === 1 ? "Room" : "Rooms"}
                        </div>
                        <div className="text-[11px] text-slate-400">{b.roomType}</div>
                      </td>

                      {/* Total Amount */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="text-xs font-bold text-slate-900">
                          {formatCurrency(grandTotal)}
                        </div>
                        {b.advanceAmount > 0 && (
                          <div className="text-[11px] text-emerald-700">
                            {formatCurrency(b.advanceAmount)} adv
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {getPaymentStatusBadge(b.paymentStatus)}
                      </td>

                      {/* Booking Source */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {getSourceBadge(b.bookingSource)}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View button */}
                          <Link
                            href={`/bookings/${b.id}`}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            title="View Booking Details"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            View
                          </Link>

                          {/* Edit button */}
                          <Link
                            href={`/bookings/${b.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            title="Edit Booking"
                          >
                            <Edit2 className="h-3 w-3 text-indigo-600" />
                            Edit
                          </Link>

                          {/* Cancel / Restore button */}
                          {isCancelled ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(b)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              title="Restore Booking"
                            >
                              <RotateCcw className="h-3 w-3 text-emerald-600" />
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCancelModalBooking(b)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                              title="Cancel Booking"
                            >
                              <Ban className="h-3 w-3 text-rose-600" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No bookings match your criteria</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, hotel filter, date range, or clear all filters to see all reservations.
            </p>
            {hasActiveFilters && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-indigo-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-100 p-2.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Booking?</h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to cancel booking{" "}
              <span className="font-mono font-bold text-slate-900">{cancelModalBooking.bookingId}</span> for{" "}
              <span className="font-semibold text-slate-900">{cancelModalBooking.guestName}</span>?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              This record will not be deleted permanently. Its status will be marked as <strong>Cancelled</strong>, and
              you can restore it at any time.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Guest changed travel plans, requested via WhatsApp"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setCancelModalBooking(null);
                  setCancelReason("");
                }}
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                No, Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Yes, Cancel Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
