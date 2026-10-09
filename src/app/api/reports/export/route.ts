import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateHotelExcelWorkbook,
  generateAllHotelsCombinedWorkbook,
  getReportFilename,
  BookingWithHotel,
} from "@/lib/excel-export";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const mode = searchParams.get("mode") || "single"; // "single" | "combined"

    const month = parseInt(monthParam || "9", 10);
    const year = parseInt(yearParam || "2026", 10);

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month (must be 1-12)" }, { status: 400 });
    }
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    // Calculate month date range using UTC to avoid timezone drift
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const allHotels = await prisma.hotel.findMany({
      orderBy: { name: "asc" },
    });

    if (allHotels.length === 0) {
      return NextResponse.json({ error: "No hotels found in system" }, { status: 404 });
    }

    // Check if combined all hotels export requested
    if (mode === "combined" || hotelId === "all") {
      const bookings = (await prisma.booking.findMany({
        where: {
          checkIn: {
            gte: startDate,
            lt: endDate,
          },
          includeInExcel: true,
        },
        include: {
          hotel: true,
        },
        orderBy: [{ checkIn: "asc" }, { createdAt: "asc" }],
      })) as BookingWithHotel[];

      const workbook = await generateAllHotelsCombinedWorkbook({
        hotels: allHotels,
        month,
        year,
        bookings,
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = getReportFilename("All_Hotels", month, year);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Single hotel export
    const targetHotel = allHotels.find((h) => h.id === hotelId);
    if (!targetHotel) {
      return NextResponse.json(
        { error: "Hotel not found. Please provide a valid hotelId." },
        { status: 404 }
      );
    }

    const bookings = (await prisma.booking.findMany({
      where: {
        hotelId: targetHotel.id,
        checkIn: {
          gte: startDate,
          lt: endDate,
        },
        includeInExcel: true,
      },
      include: {
        hotel: true,
      },
      orderBy: [{ checkIn: "asc" }, { createdAt: "asc" }],
    })) as BookingWithHotel[];

    const workbook = await generateHotelExcelWorkbook({
      hotelName: targetHotel.name,
      month,
      year,
      bookings,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = getReportFilename(targetHotel.name, month, year);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 }
    );
  }
}
