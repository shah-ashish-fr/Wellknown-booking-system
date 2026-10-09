import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/db";
import ReportsView from "./reports-view";

export const metadata = {
  title: "Reports | WellKnown Booking System",
  description: "Generate and export monthly Excel booking reports for hotels",
};

export default async function ReportsPage() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel Reports"
        description="Month-end hotel booking reports formatted according to company standards"
      />

      <ReportsView hotels={hotels} />
    </div>
  );
}
