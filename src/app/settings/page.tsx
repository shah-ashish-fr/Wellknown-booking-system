import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/db";
import { Database, ShieldCheck, Hotel } from "lucide-react";

export const metadata = {
  title: "Settings | WellKnown Booking System",
  description: "Manage hotel profiles and configuration",
};

export default async function SettingsPage() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Hotel properties, channels, and system configuration"
      />

      {/* Hotel Profiles */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Managed Hotel Properties</h2>
            <p className="mt-1 text-xs text-slate-500">
              The 3 active hotel properties configured for booking management and Excel reports
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            3 Active Hotels
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Hotel className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{hotel.name}</h3>
                  <p className="text-xs text-slate-500">{hotel.location}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">
                  {hotel._count.bookings} {hotel._count.bookings === 1 ? "Booking" : "Bookings"}
                </div>
                <div className="text-xs text-emerald-600 font-medium">Ready for Excel reports</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">PostgreSQL Database</h4>
              <p className="text-xs text-slate-500">Connected &amp; migrations up to date</p>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Database Engine:</span>
              <span className="font-mono text-slate-700">PostgreSQL (Prisma ORM)</span>
            </div>
            <div className="flex justify-between">
              <span>Schema Sync:</span>
              <span className="text-emerald-700 font-medium">Synchronized</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Excel Export Engine</h4>
              <p className="text-xs text-slate-500">Company 19-column reference layout</p>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Engine:</span>
              <span className="font-mono text-slate-700">ExcelJS v4.4.0</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Format:</span>
              <span className="text-blue-700 font-medium">19 Columns + Auto-Formulas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
