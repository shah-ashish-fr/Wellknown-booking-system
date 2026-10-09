"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface Hotel {
  id: string;
  name: string;
  location?: string;
}

interface PreviewData {
  month: number;
  year: number;
  totalBookings: number;
  confirmedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  totalAdvance: number;
  estimatedProfit: number;
  hotelBreakdown: Record<string, { count: number; revenue: number; hotelName: string }>;
  bookings: Array<{
    id: string;
    bookingId: string;
    guestName: string;
    guestPhone: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    roomType: string;
    totalAmount: number;
    advanceAmount: number;
    paymentStatus: string;
    status: string;
    bookingSource: string;
  }>;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = [2024, 2025, 2026, 2027];

export default function ReportsView({ hotels }: { hotels: Hotel[] }) {
  const [selectedHotelId, setSelectedHotelId] = useState<string>(
    hotels[0]?.id || "all"
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // October
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Fetch preview data whenever filters or refresh trigger changes
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reports/preview?hotelId=${selectedHotelId}&month=${selectedMonth}&year=${selectedYear}`
        );
        if (res.ok && !isCancelled) {
          const data = (await res.json()) as PreviewData;
          setPreview(data);
        } else if (!isCancelled) {
          setPreview(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Preview fetch error:", err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedHotelId, selectedMonth, selectedYear, refreshTrigger]);

  const fetchPreview = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Single hotel download helper
  const downloadSingleHotel = async (hotelId: string, hotelName: string) => {
    const downloadKey = `hotel-${hotelId}`;
    setDownloading(downloadKey);
    setStatusMessage({ type: "info", text: `Preparing Excel report for ${hotelName}...` });

    try {
      const url = `/api/reports/export?hotelId=${hotelId}&month=${selectedMonth}&year=${selectedYear}&mode=single`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Export request failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${hotelName}_${MONTHS[selectedMonth - 1].label}_${selectedYear}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setStatusMessage({
        type: "success",
        text: `Exported ${filename} successfully!`,
      });
    } catch (err) {
      console.error("Download failed:", err);
      setStatusMessage({
        type: "error",
        text: `Failed to export ${hotelName} report. Please try again.`,
      });
    } finally {
      setDownloading(null);
    }
  };

  // Export combined all hotels workbook (3 sheets in 1 workbook)
  const downloadAllCombined = async () => {
    setDownloading("all-combined");
    setStatusMessage({
      type: "info",
      text: `Generating Combined 3-Hotel Excel Workbook for ${MONTHS[selectedMonth - 1].label} ${selectedYear}...`,
    });

    try {
      const url = `/api/reports/export?hotelId=all&month=${selectedMonth}&year=${selectedYear}&mode=combined`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const filename = `All_Hotels_${MONTHS[selectedMonth - 1].label}_${selectedYear}.xlsx`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setStatusMessage({
        type: "success",
        text: `Exported ${filename} with individual sheets for each hotel!`,
      });
    } catch (err) {
      console.error("Download failed:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to export combined report. Please try again.",
      });
    } finally {
      setDownloading(null);
    }
  };

  // Export reports for ALL 3 hotels as separate files (one after another)
  const downloadAllThreeSeparate = async () => {
    setDownloading("all-three-separate");
    setStatusMessage({
      type: "info",
      text: `Exporting separate Excel files for all 3 hotels (${MONTHS[selectedMonth - 1].label} ${selectedYear})...`,
    });

    try {
      for (const hotel of hotels) {
        const url = `/api/reports/export?hotelId=${hotel.id}&month=${selectedMonth}&year=${selectedYear}&mode=single`;
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const filename = `${hotel.name}_${MONTHS[selectedMonth - 1].label}_${selectedYear}.xlsx`;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          // brief delay between browser downloads to prevent browser pop-up blocking
          await new Promise((res) => setTimeout(res, 600));
        }
      }

      setStatusMessage({
        type: "success",
        text: `Successfully downloaded separate Excel reports for all ${hotels.length} hotels!`,
      });
    } catch (err) {
      console.error("Batch download error:", err);
      setStatusMessage({
        type: "error",
        text: "Failed while exporting separate hotel files. Please try again.",
      });
    } finally {
      setDownloading(null);
    }
  };

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);
  const currentMonthName = MONTHS[selectedMonth - 1].label;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {statusMessage.type === "error" && <XCircle className="h-5 w-5 text-rose-600" />}
            {statusMessage.type === "info" && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Filter & Action Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {/* Selectors */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Hotel Selector */}
            <div>
              <label
                htmlFor="hotel-select"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                Hotel
              </label>
              <select
                id="hotel-select"
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Hotels (Combined)</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label
                htmlFor="month-select"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                <Calendar className="h-4 w-4 text-slate-400" />
                Month
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label
                htmlFor="year-select"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                <Calendar className="h-4 w-4 text-slate-400" />
                Year
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedHotelId !== "all" ? (
              <button
                type="button"
                id="export-single-btn"
                disabled={downloading !== null}
                onClick={() =>
                  downloadSingleHotel(selectedHotelId, selectedHotel?.name || "Hotel")
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {downloading === `hotel-${selectedHotelId}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Export {selectedHotel?.name || "Hotel"} Excel
              </button>
            ) : (
              <button
                type="button"
                id="export-combined-btn"
                disabled={downloading !== null}
                onClick={downloadAllCombined}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {downloading === "all-combined" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Export All Hotels Workbook
              </button>
            )}

            <button
              type="button"
              id="export-all-separate-btn"
              disabled={downloading !== null}
              onClick={downloadAllThreeSeparate}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
              title="Download separate Excel files for Nathdwara, Saputara, and Dwarka"
            >
              {downloading === "all-three-separate" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <Download className="h-4 w-4 text-slate-500" />
              )}
              Export All 3 Hotels (3 Files)
            </button>
          </div>
        </div>
      </div>

      {/* 3 Hotels Quick Summary Cards for Month */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {hotels.map((hotel) => {
          const stats = preview?.hotelBreakdown[hotel.id] || { count: 0, revenue: 0 };
          const isSelected = selectedHotelId === hotel.id;

          return (
            <div
              key={hotel.id}
              className={`rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{hotel.name}</h4>
                  <p className="text-xs text-slate-500">
                    {currentMonthName} {selectedYear}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSingleHotel(hotel.id, hotel.name)}
                  disabled={downloading !== null}
                  className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors"
                  title={`Download ${hotel.name} Excel`}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-slate-500">Bookings: </span>
                  <span className="font-semibold text-slate-800">{stats.count}</span>
                </div>
                <div>
                  <span className="text-slate-500">Revenue: </span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(stats.revenue)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Stats Overview */}
      {preview && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Bookings
              </span>
              <Layers className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {preview.totalBookings}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="text-emerald-600 font-medium">
                {preview.confirmedCount} confirmed
              </span>
              {preview.cancelledCount > 0 && (
                <span className="text-rose-500 font-medium">
                  • {preview.cancelledCount} cancelled
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Guest Revenue
              </span>
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {formatCurrency(preview.totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Advance: {formatCurrency(preview.totalAdvance)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Company Profit (10%)
              </span>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {formatCurrency(preview.estimatedProfit)}
            </p>
            <p className="mt-1 text-xs text-slate-500">From company formula =Q/10</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Report Format
              </span>
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 text-lg font-bold text-slate-800">
              Company Standard
            </p>
            <p className="mt-1 text-xs text-slate-500">
              19 Columns • Formulas &amp; Totals
            </p>
          </div>
        </div>
      )}

      {/* Bookings Preview Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Report Data Preview ({currentMonthName} {selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Showing records that will be included in the exported Excel spreadsheet
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPreview}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm">Loading report records...</p>
          </div>
        ) : preview && preview.bookings.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center">SR.</th>
                    <th className="px-4 py-3">Hotel</th>
                    <th className="px-4 py-3">Guest Name</th>
                    <th className="px-4 py-3 text-center">Check In</th>
                    <th className="px-4 py-3 text-center">Check Out</th>
                    <th className="px-4 py-3 text-center">Rooms</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-right">Advance</th>
                    <th className="px-4 py-3 text-right">Profit (10%)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {preview.bookings.map((booking, index) => {
                    const isCancelled = booking.status === "CANCELLED";
                    const profit = Math.round(booking.totalAmount * 0.1);

                    return (
                      <tr
                        key={booking.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelled ? "bg-rose-50/50 text-rose-800 line-through" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {booking.hotelName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{booking.guestName}</div>
                          <div className="text-xs text-slate-400">{booking.guestPhone}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          {formatDate(booking.checkOut)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {booking.rooms} {booking.roomType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(booking.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(booking.advanceAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-amber-700">
                          {formatCurrency(profit)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isCancelled ? (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Confirmed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {preview.bookings.map((booking, index) => {
                const isCancelled = booking.status === "CANCELLED";
                const profit = Math.round(booking.totalAmount * 0.1);

                return (
                  <div
                    key={booking.id}
                    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5 text-xs ${
                      isCancelled ? "bg-rose-50/30 opacity-75" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                        <span>#{index + 1}</span>
                        <span className="font-bold text-slate-900">{booking.bookingId}</span>
                      </div>
                      {isCancelled ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900">{booking.guestName}</div>
                      <div className="text-slate-500">{booking.hotelName}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-2">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Stay</span>
                        <span className="font-medium text-slate-800">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Rooms</span>
                        <span className="font-medium text-slate-800">
                          {booking.rooms} {booking.roomType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-slate-400">Total: </span>
                        <span className="font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Profit (10%): </span>
                        <span className="font-bold text-amber-700">{formatCurrency(profit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-amber-50 p-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h4 className="mt-4 text-base font-semibold text-slate-800">
              No Bookings Found
            </h4>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              No bookings are recorded for{" "}
              <span className="font-semibold text-slate-700">
                {selectedHotelId === "all" ? "any hotel" : selectedHotel?.name}
              </span>{" "}
              in{" "}
              <span className="font-semibold text-slate-700">
                {currentMonthName} {selectedYear}
              </span>
              .
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadSingleHotel(
                    selectedHotelId !== "all" ? selectedHotelId : (hotels[0]?.id || ""),
                    selectedHotel?.name || "Hotel"
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Download Blank Monthly Template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Information card on company format compliance */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Company Excel Report Format Compliance
        </div>
        <p>
          Generated spreadsheets adhere strictly to the reference company structure (19 columns):
          <br />
          <code className="text-slate-700 font-mono">
            SR.NO. • HOTEL NAME • BOOKING DATE • GUEST NAME • CONTACT DETAILS • CHECK IN DATE •
            CHECK OUT DATE • ROOM TYPE • NO OF ROOMS • NO OF NIGHT • EXTRA ADULT • PER ROOM CHARGES •
            EXTRA ADULT CHARGES • ADVANCE AMOUNT • ADVANCE RECEIVED IN WHOM • TOTAL AMOUNT TO
            RECEIVED FROM GUEST • TOTAL AMOUNT TO PAY TO HOTEL • OUR PROFIT • WHOSE REF
          </code>
        </p>
        <p>
          Includes automatic formulas for <strong>Per Room Charges</strong> (
          <code className="font-mono">=P/(I*J)</code>), <strong>Our Profit</strong> (
          <code className="font-mono">=Q/10</code>), and bottom totals (
          <code className="font-mono">=SUM(...)</code>). Cancelled bookings are formatted with
          strike-through text and marked under remarks.
        </p>
      </div>
    </div>
  );
}
