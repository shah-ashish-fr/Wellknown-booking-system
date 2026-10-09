import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BookingStatus } from "@/types/booking";
import { formatGuestFullName } from "@/lib/formatters";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const month = parseInt(monthParam || "9", 10);
    const year = parseInt(yearParam || "2026", 10);

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const whereClause: {
      checkIn: { gte: Date; lt: Date };
      hotelId?: string;
      includeInExcel: boolean;
    } = {
      checkIn: {
        gte: startDate,
        lt: endDate,
      },
      includeInExcel: true,
    };

    if (hotelId && hotelId !== "all") {
      whereClause.hotelId = hotelId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        hotel: true,
      },
      orderBy: [{ checkIn: "asc" }, { createdAt: "asc" }],
    });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === BookingStatus.CONFIRMED);
    const cancelledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELLED);

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalAdvance = confirmedBookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);
    const estimatedProfit = Math.round(totalRevenue * 0.1);

    // Group counts per hotel for quick breakdown
    const hotelBreakdown: Record<string, { count: number; revenue: number; hotelName: string }> = {};
    bookings.forEach((b) => {
      const hId = b.hotelId;
      if (!hotelBreakdown[hId]) {
        hotelBreakdown[hId] = {
          count: 0,
          revenue: 0,
          hotelName: b.hotel.name,
        };
      }
      hotelBreakdown[hId].count += 1;
      if (b.status === BookingStatus.CONFIRMED) {
        hotelBreakdown[hId].revenue += b.totalAmount || 0;
      }
    });

    return NextResponse.json({
      month,
      year,
      totalBookings,
      confirmedCount: confirmedBookings.length,
      cancelledCount: cancelledBookings.length,
      totalRevenue,
      totalAdvance,
      estimatedProfit,
      hotelBreakdown,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingId: b.bookingId,
        guestName: formatGuestFullName(b.guestTitle, b.guestName),
        guestPhone: b.guestPhone,
        hotelName: b.hotel.name,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        rooms: b.rooms,
        roomType: b.roomType,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        paymentStatus: b.paymentStatus,
        status: b.status,
        bookingSource: b.bookingSource,
      })),
    });
  } catch (error) {
    console.error("Error fetching report preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch report preview" },
      { status: 500 }
    );
  }
}
