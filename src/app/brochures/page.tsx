import { Metadata } from "next";
import BrochureDashboard from "./brochure-dashboard";

export const metadata: Metadata = {
  title: "Hotel Brochures | WellKnown Booking System",
  description: "Generate and export guest-facing hotel brochures for WellKnown properties",
};

export default function BrochuresPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
      <BrochureDashboard />
    </div>
  );
}
