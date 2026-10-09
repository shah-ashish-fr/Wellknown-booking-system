import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import {
  CalendarDays,
  Hotel,
  IndianRupee,
  Users,
  Plus,
  LogIn,
  LogOut,
  Calendar,
  Building2,
  MapPin,
  ArrowRight,
  Clock,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { formatDateShort, formatCurrency, calculateNights, formatGuestFullName } from "@/lib/formatters";
import DashboardMonthSelector from "@/components/dashboard-month-selector";

export const metadata = {
  title: "Dashboard | WellKnown Booking System",
  description: "Internal hotel booking management dashboard",
};

interface HotelItem {
  id: string;
  name: string;
  location: string;
}

interface BookingWithHotel {
  id: string;
  bookingId: string;
  hotelId: string;
  guestTitle?: string | null;
  guestName: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  rooms: number;
  roomType: string;
  totalAmount: number;
  gstAmount: number;
  advanceAmount: number;
  paymentStatus: string;
  bookingSource: string;
  status: string;
  createdAt: Date;
  hotel: HotelItem;
}

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sParams = (await searchParams) || {};
  const now = new Date();
  const currentMonthParam = typeof sParams.month === "string" ? parseInt(sParams.month, 10) : now.getMonth() + 1;
  const currentYearParam = typeof sParams.year === "string" ? parseInt(sParams.year, 10) : now.getFullYear();

  const selectedMonth = !isNaN(currentMonthParam) && currentMonthParam >= 1 && currentMonthParam <= 12 ? currentMonthParam : now.getMonth() + 1;
  const selectedYear = !isNaN(currentYearParam) && currentYearParam >= 2000 && currentYearParam <= 2100 ? currentYearParam : now.getFullYear();

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const selectedMonthName = MONTH_NAMES[selectedMonth - 1];

  let totalBookings = 0;
  let confirmedBookings = 0;
  let cancelledBookings = 0;
  let pendingPayments = 0;
  let totalRevenue = 0;
  let totalAdvance = 0;
  let dbConnected = true;

  let totalMonthBookings = 0;
  let totalMonthRevenue = 0;
  let totalMonthAdvance = 0;
  let totalMonthBalancePending = 0;
  let monthConfirmedCount = 0;

  let recentBookings: BookingWithHotel[] = [];
  let todayCheckIns: BookingWithHotel[] = [];
  let todayCheckOuts: BookingWithHotel[] = [];
  let upcomingBookings: BookingWithHotel[] = [];
  let hotelsMonthlyStats: Array<{
    id: string;
    name: string;
    location: string;
    totalBookings: number;
    totalRevenue: number;
    advanceReceived: number;
    balancePending: number;
  }> = [];

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);
    const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      allBookingsRaw,
      hotelsListRaw,
    ] = await Promise.all([
      prisma.booking.findMany({
        include: { hotel: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.hotel.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    const allBookings: BookingWithHotel[] = allBookingsRaw as unknown as BookingWithHotel[];
    const hotelsList: HotelItem[] = hotelsListRaw as unknown as HotelItem[];

    totalBookings = allBookings.length;
    confirmedBookings = allBookings.filter((b: BookingWithHotel) => b.status === "CONFIRMED").length;
    cancelledBookings = allBookings.filter((b: BookingWithHotel) => b.status === "CANCELLED").length;
    pendingPayments = allBookings.filter(
      (b: BookingWithHotel) => (b.paymentStatus === "PENDING" || b.paymentStatus === "ADVANCE_PAYMENT_DUE") && b.status === "CONFIRMED"
    ).length;

    const confirmed = allBookings.filter((b: BookingWithHotel) => b.status === "CONFIRMED");
    totalRevenue = confirmed.reduce((sum: number, b: BookingWithHotel) => sum + b.totalAmount + b.gstAmount, 0);
    totalAdvance = confirmed.reduce((sum: number, b: BookingWithHotel) => sum + b.advanceAmount, 0);

    // Recent 5 bookings
    recentBookings = allBookings.slice(0, 5);

    // Today's Check-ins
    todayCheckIns = allBookings.filter((b: BookingWithHotel) => {
      if (b.status === "CANCELLED") return false;
      const d = new Date(b.checkIn);
      return d >= startOfToday && d <= endOfToday;
    });

    // Today's Check-outs
    todayCheckOuts = allBookings.filter((b: BookingWithHotel) => {
      if (b.status === "CANCELLED") return false;
      const d = new Date(b.checkOut);
      return d >= startOfToday && d <= endOfToday;
    });

    // Upcoming Bookings (checking in within the next 7 days, excluding today)
    upcomingBookings = allBookings
      .filter((b: BookingWithHotel) => {
        if (b.status === "CANCELLED") return false;
        const d = new Date(b.checkIn);
        return d > endOfToday && d <= sevenDaysLater;
      })
      .sort((a: BookingWithHotel, b: BookingWithHotel) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
      .slice(0, 6);

    // Monthly Revenue Calculations for selectedMonth and selectedYear:
    const monthStartDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const monthEndDate = new Date(Date.UTC(selectedYear, selectedMonth, 1, 0, 0, 0));

    // Filter bookings belonging to the selected month (using check-in date consistently according to reporting logic)
    // Excel-excluded bookings remain included in dashboard revenue.
    const monthBookings = allBookings.filter((b: BookingWithHotel) => {
      const d = new Date(b.checkIn);
      return d >= monthStartDate && d < monthEndDate;
    });

    const monthConfirmed = monthBookings.filter((b: BookingWithHotel) => b.status === "CONFIRMED");
    monthConfirmedCount = monthConfirmed.length;
    totalMonthBookings = monthBookings.length;
    totalMonthRevenue = monthConfirmed.reduce((sum: number, b: BookingWithHotel) => sum + b.totalAmount + b.gstAmount, 0);
    totalMonthAdvance = monthConfirmed.reduce((sum: number, b: BookingWithHotel) => sum + b.advanceAmount, 0);
    totalMonthBalancePending = Math.max(0, totalMonthRevenue - totalMonthAdvance);

    // Hotel-wise monthly overview for all partner properties
    hotelsMonthlyStats = hotelsList.map((hotel: HotelItem) => {
      const hotelBookings = monthBookings.filter((b: BookingWithHotel) => b.hotelId === hotel.id);
      const conf = hotelBookings.filter((b: BookingWithHotel) => b.status === "CONFIRMED");
      const rev = conf.reduce((sum: number, b: BookingWithHotel) => sum + b.totalAmount + b.gstAmount, 0);
      const adv = conf.reduce((sum: number, b: BookingWithHotel) => sum + b.advanceAmount, 0);
      const bal = Math.max(0, rev - adv);

      return {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        totalBookings: hotelBookings.length,
        totalRevenue: rev,
        advanceReceived: adv,
        balancePending: bal,
      };
    });
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
    dbConnected = false;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header with Prominent New Booking Button */}
      <PageHeader
        title="Reservations Dashboard"
        description="Daily operational overview of guest arrivals, departures, occupancy, and revenue"
      >
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking</span>
        </Link>
      </PageHeader>

      {!dbConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-xs">
          <strong>Database connection notice:</strong> Unable to connect to PostgreSQL.
          Please ensure the database service is running.
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          icon={<CalendarDays className="h-5 w-5 text-indigo-600" />}
          subtitle={`${confirmedBookings} Confirmed • ${cancelledBookings} Cancelled`}
          badge={`${confirmedBookings} Active`}
          badgeColor="indigo"
        />

        <StatCard
          label="Today's Check-Ins"
          value={todayCheckIns.length}
          icon={<LogIn className="h-5 w-5 text-emerald-600" />}
          subtitle="Guest arrivals scheduled for today"
          badge={todayCheckIns.length > 0 ? "Arriving Today" : "None Today"}
          badgeColor={todayCheckIns.length > 0 ? "emerald" : "indigo"}
        />

        <StatCard
          label="Today's Check-Outs"
          value={todayCheckOuts.length}
          icon={<LogOut className="h-5 w-5 text-amber-600" />}
          subtitle="Guest departures scheduled for today"
          badge={todayCheckOuts.length > 0 ? "Departing Today" : "None Today"}
          badgeColor={todayCheckOuts.length > 0 ? "amber" : "indigo"}
        />

        <StatCard
          label={`${selectedMonthName} Revenue`}
          value={formatCurrency(totalMonthRevenue)}
          icon={<IndianRupee className="h-5 w-5 text-emerald-600" />}
          subtitle={`Advance: ${formatCurrency(totalMonthAdvance)} • Due: ${formatCurrency(totalMonthBalancePending)}`}
          badge={`${selectedMonthName} ${selectedYear}`}
          badgeColor="emerald"
        />
      </div>

      {/* Month Selector Control */}
      <DashboardMonthSelector currentMonth={selectedMonth} currentYear={selectedYear} />

      {/* Monthly Revenue & Hotel Performance Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Monthly Revenue Breakdown — {selectedMonthName} {selectedYear}
            </h2>
            <p className="text-xs text-slate-500">
              Hotel-wise financial performance and overall totals calculated for {selectedMonthName}
            </p>
          </div>
          <Link
            href={`/reports?month=${selectedMonth}&year=${selectedYear}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
          >
            <span>View Full Excel Reports</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* OVERALL TOTAL CARD */}
        <div className="rounded-2xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-800/60 pb-4 mb-5">
            <div>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-200">
                Overall Total
              </span>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight text-white">
                TOTAL — All Hotels Combined ({selectedMonthName} {selectedYear})
              </h3>
            </div>
            <span className="text-xs text-indigo-300">
              Across all 3 partner properties
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">
                Total Bookings
              </span>
              <span className="mt-1 block text-2xl sm:text-3xl font-extrabold text-white">
                {totalMonthBookings}
              </span>
              <span className="mt-0.5 block text-[11px] text-indigo-300">
                {monthConfirmedCount} confirmed
              </span>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">
                Total Revenue
              </span>
              <span className="mt-1 block text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {formatCurrency(totalMonthRevenue)}
              </span>
              <span className="mt-0.5 block text-[11px] text-indigo-300">
                Gross reservation value
              </span>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-blue-300/90">
                Total Advance Received
              </span>
              <span className="mt-1 block text-2xl sm:text-3xl font-extrabold text-blue-300">
                {formatCurrency(totalMonthAdvance)}
              </span>
              <span className="mt-0.5 block text-[11px] text-indigo-300">
                Collected deposits
              </span>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
                Total Balance Pending
              </span>
              <span className="mt-1 block text-2xl sm:text-3xl font-extrabold text-amber-300">
                {formatCurrency(totalMonthBalancePending)}
              </span>
              <span className="mt-0.5 block text-[11px] text-indigo-300">
                Due at guest check-in
              </span>
            </div>
          </div>
        </div>

        {/* HOTEL-WISE SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {hotelsMonthlyStats.map((hotel) => (
            <div
              key={hotel.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{hotel.location}</span>
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>

                {/* The 4 required fields */}
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600 font-medium">Total Bookings</span>
                    <span className="font-bold text-slate-900">{hotel.totalBookings}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600 font-medium">Total Revenue</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatCurrency(hotel.totalRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600 font-medium">Advance Received</span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(hotel.advanceReceived)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 font-medium">Balance Pending</span>
                    <span className={`font-semibold ${hotel.balancePending > 0 ? "text-amber-700" : "text-slate-500"}`}>
                      {formatCurrency(hotel.balancePending)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href={`/bookings?hotel=${hotel.id}`}
                  className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>Filter Bookings</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href={`/bookings/new?hotelId=${hotel.id}`}
                  className="font-medium text-slate-600 hover:text-slate-900"
                >
                  + Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Today's Check-ins & Today's Check-outs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Check-Ins */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <LogIn className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s Check-Ins</h3>
                <p className="text-[11px] text-slate-500">Arrivals scheduled for today</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              {todayCheckIns.length} {todayCheckIns.length === 1 ? "Guest" : "Guests"}
            </span>
          </div>

          <div className="p-4 flex-1">
            {todayCheckIns.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {todayCheckIns.map((b) => (
                  <div
                    key={b.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate"
                        >
                          {formatGuestFullName(b.guestTitle, b.guestName)}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {b.bookingId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {b.hotel.name} • {b.rooms} Room ({b.roomType})
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatCurrency(b.totalAmount + b.gstAmount)}
                      </div>
                      <Link
                        href={`/bookings/${b.id}`}
                        className="mt-1 inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                No guest check-ins scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Today's Check-Outs */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <LogOut className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s Check-Outs</h3>
                <p className="text-[11px] text-slate-500">Departures scheduled for today</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
              {todayCheckOuts.length} {todayCheckOuts.length === 1 ? "Guest" : "Guests"}
            </span>
          </div>

          <div className="p-4 flex-1">
            {todayCheckOuts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {todayCheckOuts.map((b) => {
                  const grandTotal = b.totalAmount + b.gstAmount;
                  const balanceDue = Math.max(0, grandTotal - b.advanceAmount);

                  return (
                    <div
                      key={b.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/bookings/${b.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate"
                          >
                            {formatGuestFullName(b.guestTitle, b.guestName)}
                          </Link>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {b.bookingId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {b.hotel.name} • {b.rooms} Room ({b.roomType})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-slate-900">
                          {balanceDue > 0 ? (
                            <span className="text-amber-700">Due: {formatCurrency(balanceDue)}</span>
                          ) : (
                            <span className="text-emerald-700">Settled</span>
                          )}
                        </div>
                        <Link
                          href={`/bookings/${b.id}`}
                          className="mt-1 inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                No guest check-outs scheduled for today.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Bookings (Next 7 Days) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Upcoming Bookings (Next 7 Days)</h3>
          </div>
          <Link
            href="/bookings"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            All Bookings &rarr;
          </Link>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 px-6 hover:bg-slate-50/80 transition-colors gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold shrink-0">
                    {b.hotel.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="font-semibold text-sm text-slate-900 hover:text-indigo-600"
                      >
                        {formatGuestFullName(b.guestTitle, b.guestName)}
                      </Link>
                      <span className="font-mono text-xs text-slate-400">({b.bookingId})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {b.hotel.name} • {b.rooms} Room • {b.adults} Adults
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                  <div className="text-left sm:text-right">
                    <div className="font-medium text-slate-800">
                      Check-in: {formatDateShort(b.checkIn)}
                    </div>
                    <div className="text-slate-400">
                      Stay: {calculateNights(b.checkIn, b.checkOut)} Nights
                    </div>
                  </div>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No upcoming bookings in the next 7 days.
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Bookings</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Latest reservations added to the system
            </p>
          </div>
          <Link
            href="/bookings"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View all bookings &rarr;
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 px-6 hover:bg-slate-50/80 transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                    {b.hotel.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="font-semibold text-sm text-slate-900 hover:text-indigo-600"
                      >
                        {formatGuestFullName(b.guestTitle, b.guestName)}
                      </Link>
                      <span className="font-mono text-xs text-slate-400">({b.bookingId})</span>
                      {b.status === "CANCELLED" && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {b.hotel.name} • {formatDateShort(b.checkIn)} - {formatDateShort(b.checkOut)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(b.totalAmount + b.gstAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.paymentStatus === "ADVANCE_PAYMENT_DUE"
                        ? "Advance Payment Due"
                        : b.paymentStatus === "ADVANCE_PAID"
                        ? "Advance Paid"
                        : b.paymentStatus === "FULLY_PAID"
                        ? "Fully Paid"
                        : b.paymentStatus === "REFUNDED"
                        ? "Refunded"
                        : "Pending"}
                    </div>
                  </div>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            No bookings recorded yet.{" "}
            <Link href="/bookings/new" className="text-indigo-600 hover:underline font-semibold">
              Create your first booking
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}
