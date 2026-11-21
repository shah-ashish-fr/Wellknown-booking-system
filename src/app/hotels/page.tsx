import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/page-header";
import {
  Building2,
  MapPin,
  Phone,
  Calendar,
  ExternalLink,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export const metadata = {
  title: "Hotels | WellKnown Booking System",
  description: "Managed hotel properties, locations, contact info, and booking stats",
};

interface HotelMeta {
  mapsUrl: string;
  phone: string;
  reception: string;
  whatsappDesk: string;
}

const HOTEL_METAS: Record<string, HotelMeta> = {
  "hotel-shivansh": {
    mapsUrl: "https://maps.app.goo.gl/i3aVyHLHWpbuXBAT8",
    phone: "+91 76000 30080",
    reception: "+91 80588 77468",
    whatsappDesk: "+91 88660 07770",
  },
  "cmupjnb390000c7m4l8141fqu": {
    mapsUrl: "https://maps.app.goo.gl/hfb2guRuUGtyYYzNA",
    phone: "+91 99740 89159",
    reception: "+91 95741 30505",
    whatsappDesk: "+91 95741 30505",
  },
  "manas-homestay": {
    mapsUrl: "https://maps.app.goo.gl/xYmVyuvknaAq6SoH7",
    phone: "+91 76000 30080",
    reception: "+91 8733013182 (For Emergency)",
    whatsappDesk: "+91 88660 07770",
  },
};

interface HotelBookingItem {
  id: string;
  totalAmount: number;
  gstAmount: number;
  status: string;
}

interface HotelPropertyItem {
  id: string;
  name: string;
  location: string;
  bookings: HotelBookingItem[];
  _count: {
    bookings: number;
  };
}

export default async function HotelsPage() {
  const hotelsRaw = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    include: {
      bookings: {
        select: {
          id: true,
          totalAmount: true,
          gstAmount: true,
          status: true,
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
  });

  const hotels: HotelPropertyItem[] = hotelsRaw as unknown as HotelPropertyItem[];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Managed Hotel Properties"
        description="Locations, front-desk contacts, Google Maps, and reservations across our 3 partner properties"
      >
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking</span>
        </Link>
      </PageHeader>

      {/* Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hotels.map((hotel: HotelPropertyItem) => {
          const meta = HOTEL_METAS[hotel.id] || {
            mapsUrl: "#",
            phone: "+91 76000 30080",
            reception: "+91 80588 77468",
            whatsappDesk: "+91 88660 07770",
          };

          const activeBookings = hotel.bookings.filter((b: HotelBookingItem) => b.status === "CONFIRMED");
          const totalRevenue = activeBookings.reduce(
            (sum: number, b: HotelBookingItem) => sum + b.totalAmount + b.gstAmount,
            0
          );

          return (
            <div
              key={hotel.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Active Partner
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {hotel.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{hotel.location}</span>
                  </p>
                </div>

                {/* Key stats */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                      Total Bookings
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {hotel._count.bookings}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                      Confirmed Revenue
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* Contacts & Map */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500">Main:</span>{" "}
                      <a href={`tel:${meta.phone.replace(/\s+/g, "")}`} className="font-medium text-slate-800 hover:text-indigo-600">
                        {meta.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500">Desk / Emergency:</span>{" "}
                      <span className="font-medium text-slate-800">{meta.reception}</span>
                    </div>
                  </div>
                  {meta.mapsUrl && (
                    <div className="pt-1">
                      <a
                        href={meta.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Google Maps Location</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/bookings?hotel=${hotel.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-2 px-1"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>View Bookings</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>

                <Link
                  href={`/bookings/new?hotelId=${hotel.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Book</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
