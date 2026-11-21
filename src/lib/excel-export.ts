import ExcelJS from "exceljs";
import { Booking, Hotel } from "@prisma/client";
import { BookingStatus } from "@/types/booking";
import { formatGuestFullName } from "./formatters";

export type BookingWithHotel = Booking & {
  hotel: Hotel;
};

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const MONTH_SHORT_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUNE",
  "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"
];

/**
 * Format a Date to DD.MM.YY string matching company reference sheets (e.g. 04.06.26)
 */
export function formatExcelDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/**
 * Calculate nights between check-in and check-out
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  try {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

/**
 * Company's exact 19 columns specification from reference templates:
 * 1. SR.NO.
 * 2. HOTEL NAME
 * 3. BOOKING DATE
 * 4. GUEST NAME
 * 5. CONTACT DETAILS
 * 6. CHECK IN DATE
 * 7. CHECK OUT DATE
 * 8. ROOM TYPE
 * 9. NO OF ROOMS
 * 10. NO OF NIGHT
 * 11. EXTRA ADULT
 * 12. PER ROOM CHARGES
 * 13. EXTRA ADULT CHARGES
 * 14. ADVANCE AMOUNT
 * 15. ADVANCE RECEIVED IN WHOM
 * 16. TOTAL AMOUNT TO RECEIVED FROM GUEST
 * 17. TOTAL AMOUNT TO PAY TO HOTEL
 * 18. OUR PROFIT
 * 19. WHOSE REF
 */
export const EXCEL_COLUMNS: { header: string; width: number; align?: "center" | "left" | "right" }[] = [
  { header: "SR.NO.", width: 8.5, align: "center" },
  { header: "HOTEL NAME", width: 18, align: "center" },
  { header: "BOOKING DATE", width: 15, align: "center" },
  { header: "GUEST NAME", width: 26, align: "center" },
  { header: "CONTACT DETAILS", width: 18, align: "center" },
  { header: "CHECK IN DATE", width: 15, align: "center" },
  { header: "CHECK OUT DATE", width: 15, align: "center" },
  { header: "ROOM TYPE", width: 18, align: "center" },
  { header: "NO OF ROOMS", width: 13, align: "center" },
  { header: "NO OF NIGHT", width: 13, align: "center" },
  { header: "EXTRA ADULT", width: 14, align: "center" },
  { header: "PER ROOM CHARGES", width: 18, align: "center" },
  { header: "EXTRA ADULT CHARGES", width: 18, align: "center" },
  { header: "ADVANCE AMOUNT", width: 16, align: "center" },
  { header: "ADVANCE RECEIVED IN WHOM", width: 24, align: "center" },
  { header: "TOTAL AMOUNT TO RECEIVED FROM GUEST", width: 24, align: "center" },
  { header: "TOTAL AMOUNT TO PAY TO HOTEL", width: 24, align: "center" },
  { header: "OUR PROFIT", width: 14, align: "center" },
  { header: "WHOSE REF", width: 20, align: "center" },
];

/**
 * Configure and populate a worksheet according to company's reference layout
 */
export function populateWorksheet(
  ws: ExcelJS.Worksheet,
  hotelName: string,
  bookings: BookingWithHotel[]
) {
  // 1. Setup columns
  ws.columns = EXCEL_COLUMNS.map((col) => ({
    header: col.header,
    width: col.width,
  }));

  // 2. Style Header Row (Row 1)
  const headerRow = ws.getRow(1);
  headerRow.height = 42;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      underline: "single",
      color: { argb: "FF000000" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // 3. Populate Data Rows (Exclude any bookings marked includeInExcel === false)
  const eligibleBookings = bookings.filter((b) => (b as any).includeInExcel !== false);

  eligibleBookings.forEach((booking, index) => {
    const rowNumber = index + 2; // header is row 1
    const isCancelled = booking.status === BookingStatus.CANCELLED;
    const isRefunded =
      booking.paymentStatus === "REFUNDED" ||
      (booking.paymentStatus as any) === "Refunded";
    const nights = calculateNights(booking.checkIn, booking.checkOut);
    const rooms = booking.rooms || 1;
    const extraAdults = Math.max(0, (booking.adults || 1) - rooms * 2);
    const totalAmount = booking.totalAmount || 0;
    const advanceAmount = booking.advanceAmount || 0;
    const perRoomCharge = rooms > 0 && nights > 0 ? Math.round(totalAmount / (rooms * nights)) : totalAmount;
    const profitAmount = Math.round(totalAmount * 0.1);

    // Default "Advance Received in Whom" to Hotel Name or WELLKNOWN
    const advanceWhom = advanceAmount > 0 ? (booking.hotel?.name || hotelName || "WELLKNOWN").toUpperCase() : "";

    // WHOSE REF / Remarks column
    let whoseRef = (booking.bookingSource || "OFFLINE").toUpperCase();
    if (booking.bookingSource === "TRAVEL_AGENT" || (booking.bookingSource as string) === "Travel Agent") {
      whoseRef = booking.travelAgent ? `TRAVEL AGENT (${booking.travelAgent.toUpperCase()})` : "TRAVEL AGENT";
    }
    if (isRefunded) {
      whoseRef = `${whoseRef} (REFUNDED)`;
    }
    if (isCancelled) {
      whoseRef = booking.cancellationReason
        ? `CANCELLED (${booking.cancellationReason})`
        : "BOOKING CANCELLED";
    }

    // Parse room pricing & meal selections
    let roomPricingList: any[] = [];
    if ((booking as any).roomPricing) {
      if (typeof (booking as any).roomPricing === "string") {
        try { roomPricingList = JSON.parse((booking as any).roomPricing); } catch {}
      } else if (Array.isArray((booking as any).roomPricing)) {
        roomPricingList = (booking as any).roomPricing;
      }
    }
    let mealSelectionsList: any[] = [];
    if ((booking as any).mealSelections) {
      if (typeof (booking as any).mealSelections === "string") {
        try { mealSelectionsList = JSON.parse((booking as any).mealSelections); } catch {}
      } else if (Array.isArray((booking as any).mealSelections)) {
        mealSelectionsList = (booking as any).mealSelections;
      }
    }

    // Append meal summary to WHOSE REF / Remarks column if meals are present
    if (mealSelectionsList.length > 0) {
      const mealParts = mealSelectionsList.map((m: any) =>
        `${m.mealType || "Meal"}: ₹${Number(m.subtotal || 0).toLocaleString("en-IN")}`
      );
      const mealsSummary = `Meals: [${mealParts.join(", ")}]`;
      whoseRef = whoseRef ? `${whoseRef} | ${mealsSummary}` : mealsSummary;
    }

    const row = ws.getRow(rowNumber);
    row.height = 22;

    // Col 1: SR.NO.
    row.getCell(1).value = index + 1;
    // Col 2: HOTEL NAME
    row.getCell(2).value = (booking.hotel?.name || hotelName).toUpperCase();
    // Col 3: BOOKING DATE
    row.getCell(3).value = formatExcelDate(booking.createdAt);
    // Col 4: GUEST NAME
    row.getCell(4).value = formatGuestFullName(booking.guestTitle, booking.guestName);
    // Col 5: CONTACT DETAILS
    row.getCell(5).value = booking.guestPhone || "";
    // Col 6: CHECK IN DATE
    row.getCell(6).value = formatExcelDate(booking.checkIn);
    // Col 7: CHECK OUT DATE
    row.getCell(7).value = formatExcelDate(booking.checkOut);
    // Col 8: ROOM TYPE
    row.getCell(8).value = booking.roomType || "Standard";
    // Col 9: NO OF ROOMS
    row.getCell(9).value = rooms;
    // Col 10: NO OF NIGHT
    row.getCell(10).value = nights;
    // Col 11: EXTRA ADULT
    row.getCell(11).value = extraAdults > 0 ? extraAdults : null;
    // Col 12: PER ROOM CHARGES
    // If exact room pricing exists for a single room type, use it; otherwise compute or use Excel formula
    const singlePrice = roomPricingList.length === 1 && Number(roomPricingList[0].pricePerNight) > 0
      ? Number(roomPricingList[0].pricePerNight)
      : null;

    if (singlePrice) {
      row.getCell(12).value = singlePrice;
    } else {
      row.getCell(12).value = {
        formula: `P${rowNumber}/(I${rowNumber}*J${rowNumber})`,
        result: perRoomCharge,
      };
    }
    row.getCell(12).numFmt = "#,##0";
    // Col 13: EXTRA ADULT CHARGES
    row.getCell(13).value = null;
    // Col 14: ADVANCE AMOUNT
    row.getCell(14).value = advanceAmount;
    row.getCell(14).numFmt = "#,##0";
    // Col 15: ADVANCE RECEIVED IN WHOM
    row.getCell(15).value = advanceWhom;
    // Col 16: TOTAL AMOUNT TO RECEIVED FROM GUEST
    row.getCell(16).value = totalAmount;
    row.getCell(16).numFmt = "#,##0";
    // Col 17: TOTAL AMOUNT TO PAY TO HOTEL
    row.getCell(17).value = totalAmount;
    row.getCell(17).numFmt = "#,##0";
    // Col 18: OUR PROFIT (Formula `=Q{row}/10` with computed fallback)
    row.getCell(18).value = {
      formula: `Q${rowNumber}/10`,
      result: profitAmount,
    };
    row.getCell(18).numFmt = "#,##0";
    // Col 19: WHOSE REF
    row.getCell(19).value = whoseRef;

    // Apply formatting to every data cell in the row
    for (let c = 1; c <= 19; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      if (isCancelled) {
        cell.font = {
          name: "Calibri",
          size: 11,
          strike: true,
          color: { argb: "FFDC2626" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEE2E2" },
        };
      } else {
        cell.font = {
          name: "Calibri",
          size: 11,
          color: { argb: "FF000000" },
        };
      }
    }
  });

  // 4. Totals Row
  const startRow = 2;
  const endRow = bookings.length > 0 ? bookings.length + 1 : 2;
  const totalsRowNumber = bookings.length > 0 ? bookings.length + 2 : 3;
  const totalsRow = ws.getRow(totalsRowNumber);
  totalsRow.height = 24;

  if (bookings.length > 0) {
    totalsRow.getCell(1).value = "TOTAL";
    totalsRow.getCell(9).value = { formula: `SUM(I${startRow}:I${endRow})` };
    totalsRow.getCell(14).value = { formula: `SUM(N${startRow}:N${endRow})` };
    totalsRow.getCell(14).numFmt = "#,##0";
    totalsRow.getCell(16).value = { formula: `SUM(P${startRow}:P${endRow})` };
    totalsRow.getCell(16).numFmt = "#,##0";
    totalsRow.getCell(17).value = { formula: `SUM(Q${startRow}:Q${endRow})` };
    totalsRow.getCell(17).numFmt = "#,##0";
    totalsRow.getCell(18).value = { formula: `SUM(R${startRow}:R${endRow})` };
    totalsRow.getCell(18).numFmt = "#,##0";

    for (let c = 1; c <= 19; c++) {
      const cell = totalsRow.getCell(c);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "double" },
        right: { style: "thin" },
      };
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF000000" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9FAFB" },
      };
    }
  } else {
    // If no bookings found, add an informative clean empty row
    const emptyRow = ws.getRow(2);
    emptyRow.height = 28;
    emptyRow.getCell(1).value = "-";
    emptyRow.getCell(2).value = hotelName.toUpperCase();
    emptyRow.getCell(4).value = "No bookings found for selected period";
    for (let c = 1; c <= 19; c++) {
      const cell = emptyRow.getCell(c);
      cell.border = thinBorder;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF6B7280" } };
    }
  }
}

/**
 * Generate workbook for a single hotel
 */
export async function generateHotelExcelWorkbook(options: {
  hotelName: string;
  month: number; // 1 - 12
  year: number; // e.g. 2026
  bookings: BookingWithHotel[];
}): Promise<ExcelJS.Workbook> {
  const { hotelName, month, year, bookings } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WellKnown Booking System";
  workbook.created = new Date();

  const monthShort = MONTH_SHORT_NAMES[month - 1] || "MONTH";
  const yearShort = String(year).slice(-2);
  const sheetName = `${monthShort}-${yearShort}`;

  const ws = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  populateWorksheet(ws, hotelName, bookings);
  return workbook;
}

/**
 * Generate a combined workbook with separate sheets for each hotel
 */
export async function generateAllHotelsCombinedWorkbook(options: {
  hotels: { id: string; name: string }[];
  month: number; // 1 - 12
  year: number; // e.g. 2026
  bookings: BookingWithHotel[];
}): Promise<ExcelJS.Workbook> {
  const { hotels, month, year, bookings } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WellKnown Booking System";
  workbook.created = new Date();

  const monthShort = MONTH_SHORT_NAMES[month - 1] || "MONTH";
  const yearShort = String(year).slice(-2);

  hotels.forEach((hotel) => {
    const hotelBookings = bookings.filter((b) => b.hotelId === hotel.id);
    const sheetName = `${hotel.name} - ${monthShort}-${yearShort}`.slice(0, 31); // Excel max 31 chars
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });
    populateWorksheet(ws, hotel.name, hotelBookings);
  });

  return workbook;
}

/**
 * Format standard output filename
 */
export function getReportFilename(hotelName: string, month: number, year: number): string {
  const monthName = MONTH_NAMES[month - 1] || `Month_${month}`;
  return `${hotelName}_${monthName}_${year}.xlsx`;
}
