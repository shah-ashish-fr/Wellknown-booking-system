"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Edit2, Ban, RotateCcw, AlertTriangle, Loader2, FileSpreadsheet } from "lucide-react";
import { BookingStatus } from "@/types/booking";
import { cancelBooking, restoreBooking, updateBookingExcelInclusion } from "@/app/actions/booking";

interface BookingDetailsActionsProps {
  id: string;
  bookingId: string;
  guestName: string;
  status: BookingStatus;
  includeInExcel?: boolean;
  showEditButton?: boolean;
}

export default function BookingDetailsActions({
  id,
  bookingId,
  guestName,
  status,
  includeInExcel = true,
  showEditButton = false,
}: BookingDetailsActionsProps) {
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(status);
  const [excelIncluded, setExcelIncluded] = useState(includeInExcel);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isExcelPending, startExcelTransition] = useTransition();

  const handleToggleExcel = (newValue: boolean) => {
    startExcelTransition(async () => {
      const res = await updateBookingExcelInclusion(id, newValue);
      if (res.success) {
        setExcelIncluded(newValue);
      }
    });
  };

  const handleConfirmCancel = () => {
    startTransition(async () => {
      const res = await cancelBooking(id, cancelReason);
      if (res.success) {
        setCurrentStatus(BookingStatus.CANCELLED);
        setShowCancelModal(false);
        setCancelReason("");
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      const res = await restoreBooking(id);
      if (res.success) {
        setCurrentStatus(BookingStatus.CONFIRMED);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Include in Excel Dropdown / Toggle */}
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs min-h-[42px]">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-slate-500 font-semibold whitespace-nowrap">Excel:</span>
          <select
            value={excelIncluded ? "yes" : "no"}
            onChange={(e) => handleToggleExcel(e.target.value === "yes")}
            disabled={isExcelPending}
            className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer py-0.5 pr-1 disabled:opacity-50"
            aria-label="Include in Excel report"
          >
            <option value="yes">Yes (Included)</option>
            <option value="no">No (Excluded)</option>
          </select>
          {isExcelPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 ml-1" />}
        </div>

        {showEditButton && (
          <Link
            href={`/bookings/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors min-h-[42px]"
          >
            <Edit2 className="h-4 w-4 text-slate-500" />
            <span>Edit Booking</span>
          </Link>
        )}

        {currentStatus === BookingStatus.CANCELLED ? (
          <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors disabled:opacity-50 min-h-[42px]"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <RotateCcw className="h-4 w-4 text-emerald-600" />
            )}
            <span>Restore Booking</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-rose-700 shadow-2xs hover:bg-rose-100 transition-colors min-h-[42px]"
          >
            <Ban className="h-4 w-4 text-rose-600" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-100 p-2.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Booking?</h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to cancel booking <span className="font-mono font-bold text-slate-900">{bookingId}</span> for{" "}
              <span className="font-semibold text-slate-900">{guestName}</span>?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              This reservation will not be permanently deleted. Its status will be changed to <strong>Cancelled</strong>,
              preserving all records for internal audit. You can restore it anytime.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Guest changed plans via WhatsApp message"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[40px]"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 min-h-[40px]"
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
    </>
  );
}
