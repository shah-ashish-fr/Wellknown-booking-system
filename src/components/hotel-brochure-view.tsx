"use client";

import {
  HotelBrochureData,
  BrochureRoomType,
  BrochureMealOption,
} from "@/config/hotel-brochures";
import {
  MapPin,
  Phone,
  Clock,
  Wifi,
  Tv,
  Coffee,
  CheckCircle2,
  Utensils,
  ExternalLink,
  ShieldCheck,
  BedDouble,
  Users,
  Compass,
  FileCheck,
  Building,
  Sparkles,
} from "lucide-react";

interface HotelBrochureViewProps {
  data: HotelBrochureData;
  className?: string;
}

export default function HotelBrochureView({
  data,
  className = "",
}: HotelBrochureViewProps) {
  return (
    <div
      id="brochure-printable-document"
      className={`bg-white text-slate-800 font-sans shadow-lg rounded-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto ${className}`}
    >
      {/* TOP BRANDING BAR */}
      <div className="bg-slate-950 text-white px-6 py-3 flex items-center justify-between border-b border-amber-500/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-xs shadow-xs">
            WK
          </div>
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-amber-300 block leading-tight">
              WellKnown Hospitality Services
            </span>
            <span className="text-[10px] text-slate-400 block leading-none">
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Official Guest Brochure</span>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden">
        {/* Hotel Cover Image */}
        {data.coverImage ? (
          <img
            src={data.coverImage}
            alt={data.name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900 flex items-center justify-center text-white">
            <Building className="h-16 w-16 opacity-30" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-slate-950 tracking-wide uppercase shadow-sm">
            <MapPin className="h-3 w-3" />
            {data.location}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {data.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-medium leading-relaxed italic text-amber-200/90">
            "{data.tagline}"
          </p>
        </div>
      </div>

      {/* QUICK HIGHLIGHTS BAR */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-6 py-3.5 border-y border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="border-r border-slate-800 last:border-none">
          <span className="text-[10px] uppercase font-semibold text-amber-300 block">Check-In</span>
          <span className="text-xs font-bold text-slate-100 flex items-center justify-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-amber-400" /> {data.checkInTime}
          </span>
        </div>
        <div className="border-r border-slate-800 last:border-none">
          <span className="text-[10px] uppercase font-semibold text-amber-300 block">Check-Out</span>
          <span className="text-xs font-bold text-slate-100 flex items-center justify-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-amber-400" /> {data.checkOutTime}
          </span>
        </div>
        <div className="border-r border-slate-800 last:border-none">
          <span className="text-[10px] uppercase font-semibold text-amber-300 block">Wi-Fi</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
            <Wifi className="h-3 w-3" /> Free High-Speed
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-amber-300 block">Environment</span>
          <span className="text-xs font-bold text-slate-100 flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="h-3 w-3 text-indigo-400" /> Family Friendly
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* ABOUT HOTEL */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              About the Property
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {data.description}
          </p>
        </section>

        {/* ROOM TYPES & ACCOMMODATION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Accommodations &amp; Room Types
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              {data.roomTypes.length} Available Categories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.roomTypes.map((room, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4 text-indigo-600" />
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                      <span>{room.bedType}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <Users className="h-3 w-3 text-slate-400" />
                        {room.occupancy}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {room.description}
                </p>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {room.amenities.map((item, aIdx) => (
                      <span
                        key={aIdx}
                        className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200 shadow-2xs"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* MEAL OPTIONS (If configured / Hotel Shree Kesari Nandan) */}
        {data.mealsEnabled && data.meals && data.meals.length > 0 && (
          <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/40 p-5">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-amber-700" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-950">
                  Pure Vegetarian Dining Options
                </h2>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                Hotel Shree Kesari Nandan
              </span>
            </div>

            <p className="text-xs text-amber-900/80 leading-relaxed">
              We offer fresh, hygienic, pure vegetarian meal arrangements tailored for traveling families and pilgrimage yatris. Meals can be added at booking or availed during stay.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {data.meals.map((meal, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-200 bg-white p-3 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Utensils className="h-3 w-3 text-amber-600" />
                      {meal.mealType}
                    </span>
                    {meal.timing && (
                      <span className="text-[10px] font-medium text-slate-500">
                        {meal.timing}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    {meal.description}
                  </p>
                  {meal.pricingNote && (
                    <span className="text-[10px] font-semibold text-amber-800 block">
                      • {meal.pricingNote}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROPERTY AMENITIES & FACILITIES */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Property Amenities &amp; Services
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {data.amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs text-slate-800 font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="leading-tight">{amenity}</span>
              </div>
            ))}
          </div>
        </section>

        {/* NEARBY ATTRACTIONS & LOCATION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Nearby Landmarks */}
          {data.nearbyAttractions && data.nearbyAttractions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Compass className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Nearby Attractions
                </h2>
              </div>
              <ul className="space-y-1.5">
                {data.nearbyAttractions.map((attraction, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 leading-normal"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{attraction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hotel Policies */}
          {data.policies && data.policies.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Important Guest Policies
                </h2>
              </div>
              <ul className="space-y-1.5">
                {data.policies.map((policy, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 leading-normal"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* CONTACT & RESERVATION CARD */}
        <section className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Reservations &amp; Inquiries
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Connect Directly with the Property
              </h3>
            </div>
            {data.mapsUrl && (
              <a
                href={data.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Open Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Primary Phone */}
            <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Direct / WhatsApp
              </span>
              <a
                href={`tel:${data.phone.replace(/\s+/g, "")}`}
                className="text-sm font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5 text-indigo-600" />
                {data.phone}
              </a>
            </div>

            {/* Reception */}
            {data.reception && (
              <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Hotel Reception
                </span>
                <a
                  href={`tel:${data.reception.replace(/\s+/g, "")}`}
                  className="text-sm font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 text-indigo-600" />
                  {data.reception}
                </a>
              </div>
            )}

            {/* Emergency / Owner Contact */}
            {data.emergencyOwner && (
              <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Emergency / Owner
                </span>
                <a
                  href={`tel:${data.emergencyOwner.replace(/\s+/g, "")}`}
                  className="text-sm font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 text-rose-600" />
                  {data.emergencyOwner}
                </a>
              </div>
            )}
          </div>

          {/* Full address */}
          <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{data.fullAddress || data.location}</span>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800 text-center sm:text-left text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200">
            Managed by WellKnown Hospitality Services
          </span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            For booking inquiries, reservations, or pilgrim package assistance, please contact us.
          </span>
        </div>
        <div className="text-[11px] text-amber-300 font-mono">
        </div>
      </footer>
    </div>
  );
}
