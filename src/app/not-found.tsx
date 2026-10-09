import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <FileQuestion className="h-10 w-10 text-slate-500" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Page or Booking Not Found</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        The page or booking record you requested does not exist or may have been moved.
      </p>
      <div className="mt-6">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Link>
      </div>
    </div>
  );
}
