"use server";

import { prisma } from "@/lib/db";
import { PaymentStatus, BookingSource, BookingStatus, RoomAllocation, RoomPricing, MealSelection } from "@/types/booking";
import { revalidatePath } from "next/cache";
import { capitalizeGuestName } from "@/lib/formatters";
import {
  parseRoomAllocations,
  formatRoomAllocationsSummary,
  getTotalRoomCount,
} from "@/lib/room-allocations";

export interface BookingFormData {
  hotelId: string;
  guestTitle?: string;
  guestName: string;
  guestPhone: string;
  bookingId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  rooms: number;
  roomType: string;
  roomAllocations?: RoomAllocation[];
  roomPricing?: RoomPricing[];
  mealSelections?: MealSelection[];
  totalAmount: number;
  gstAmount: number;
  advanceAmount: number;
  paymentStatus: PaymentStatus;
  bookingSource: BookingSource;
  travelAgent?: string;
  includeInExcel?: boolean;
  notes?: string;
}

/**
 * Normalize phone: strip spaces and ensure single +91 prefix.
 * Returns "+91XXXXXXXXXX" for valid inputs, or the cleaned string as-is.
 */
function normalizePhone(raw: string): string {
  // Strip all whitespace
  let phone = raw.replace(/\s+/g, "");
  // Remove leading +91 or 91 prefix to get bare digits
  if (phone.startsWith("+91")) {
    phone = phone.slice(3);
  } else if (phone.startsWith("91") && phone.length > 10) {
    phone = phone.slice(2);
  }
  // Remove any remaining non-digit characters
  phone = phone.replace(/\D/g, "");
  // Re-add +91 prefix
  if (phone.length === 10) {
    return `+91${phone}`;
  }
  // If not exactly 10 digits, return as-is with +91
  return phone ? `+91${phone}` : "";
}

export interface ActionResult {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  bookingId?: string;
}

export async function getHotels() {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { name: "asc" },
    });
    return hotels;
  } catch (error) {
    console.error("Failed to load hotels:", error);
    return [];
  }
}

export async function createBooking(data: BookingFormData): Promise<ActionResult> {
  const errors: Record<string, string> = {};

  // 1. Hotel validation
  if (!data.hotelId || data.hotelId.trim() === "") {
    errors.hotelId = "Please select a hotel.";
  }

  // 2. Guest Name validation
  if (!data.guestName || data.guestName.trim() === "") {
    errors.guestName = "Guest name is required.";
  } else if (data.guestName.trim().length < 2) {
    errors.guestName = "Guest name must be at least 2 characters.";
  }

  // 2b. Phone validation
  if (data.guestPhone && data.guestPhone.trim() !== "") {
    const rawDigits = data.guestPhone.replace(/\D/g, "");
    const tenDigits = rawDigits.startsWith("91") && rawDigits.length === 12
      ? rawDigits.slice(2)
      : rawDigits;
    if (tenDigits.length !== 10) {
      errors.guestPhone = "Please enter a valid 10-digit mobile number.";
    }
  }

  // 3. Booking ID validation
  if (!data.bookingId || data.bookingId.trim() === "") {
    errors.bookingId = "Booking ID is required.";
  }

  // 4. Check-in validation
  if (!data.checkIn || data.checkIn.trim() === "") {
    errors.checkIn = "Check-in date is required.";
  }

  // 5. Check-out validation
  if (!data.checkOut || data.checkOut.trim() === "") {
    errors.checkOut = "Check-out date is required.";
  }

  // Date comparison
  if (data.checkIn && data.checkOut) {
    const inDate = new Date(data.checkIn);
    const outDate = new Date(data.checkOut);

    if (isNaN(inDate.getTime())) {
      errors.checkIn = "Please enter a valid check-in date.";
    }
    if (isNaN(outDate.getTime())) {
      errors.checkOut = "Please enter a valid check-out date.";
    }

    if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime())) {
      if (outDate < inDate) {
        errors.checkOut = "Check-out date cannot be before check-in date.";
      }
    }
  }

  // 6. Numeric fields: Adults, Children, Rooms
  if (data.adults === undefined || data.adults === null || isNaN(Number(data.adults)) || Number(data.adults) < 1) {
    errors.adults = "Adults must be at least 1.";
  }

  if (data.children === undefined || data.children === null || isNaN(Number(data.children)) || Number(data.children) < 0) {
    errors.children = "Children must be 0 or greater.";
  }

  if (data.rooms === undefined || data.rooms === null || isNaN(Number(data.rooms)) || Number(data.rooms) < 1) {
    errors.rooms = "Number of rooms must be at least 1.";
  }

  // 7. Amount fields
  if (data.totalAmount === undefined || data.totalAmount === null || isNaN(Number(data.totalAmount)) || Number(data.totalAmount) < 0) {
    errors.totalAmount = "Total amount must be a valid non-negative number.";
  }

  if (data.gstAmount === undefined || data.gstAmount === null || isNaN(Number(data.gstAmount)) || Number(data.gstAmount) < 0) {
    errors.gstAmount = "GST amount must be a valid non-negative number.";
  }

  if (data.advanceAmount === undefined || data.advanceAmount === null || isNaN(Number(data.advanceAmount)) || Number(data.advanceAmount) < 0) {
    errors.advanceAmount = "Advance amount must be a valid non-negative number.";
  }

  // If there are validation errors, return early
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
      message: "Please correct the highlighted errors.",
    };
  }

  try {
    const trimmedBookingId = data.bookingId.trim();

    // Check for duplicate Booking ID
    const existingBooking = await prisma.booking.findUnique({
      where: { bookingId: trimmedBookingId },
    });

    if (existingBooking) {
      return {
        success: false,
        errors: {
          bookingId: `Booking ID "${trimmedBookingId}" already exists. Please use a unique booking ID.`,
        },
        message: "Duplicate booking ID detected.",
      };
    }

    // Verify hotel exists
    const hotelExists = await prisma.hotel.findUnique({
      where: { id: data.hotelId },
    });

    if (!hotelExists) {
      return {
        success: false,
        errors: {
          hotelId: "Selected hotel was not found in the database.",
        },
        message: "Invalid hotel selected.",
      };
    }

    // Normalize guest name with proper word capitalization
    let cleanGuestName = capitalizeGuestName(data.guestName || "");
    if (data.guestTitle && cleanGuestName) {
      const titleClean = data.guestTitle.replace(/\./g, "").trim().toLowerCase();
      const words = cleanGuestName.split(/\s+/);
      if (words.length > 1) {
        const firstWordClean = words[0].replace(/\./g, "").trim().toLowerCase();
        if (firstWordClean === titleClean) {
          cleanGuestName = words.slice(1).join(" ");
        }
      }
    }

    // Create booking in PostgreSQL
    // Handle multiple room allocations or single room type
    let allocationsToStore = data.roomAllocations && data.roomAllocations.length > 0
      ? data.roomAllocations
      : null;
    let totalRooms = Math.floor(Number(data.rooms)) || 1;
    let formattedRoomType = (data.roomType || "Standard").trim();

    if (allocationsToStore && allocationsToStore.length > 0) {
      totalRooms = getTotalRoomCount(allocationsToStore);
      formattedRoomType = formatRoomAllocationsSummary(allocationsToStore);
    } else {
      allocationsToStore = parseRoomAllocations(null, formattedRoomType, totalRooms);
    }

    const newBooking = await prisma.booking.create({
      data: {
        bookingId: trimmedBookingId,
        hotelId: data.hotelId,
        guestTitle: data.guestTitle || null,
        guestName: cleanGuestName,
        guestPhone: normalizePhone(data.guestPhone || ""),
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        adults: Math.floor(Number(data.adults)),
        children: Math.floor(Number(data.children)),
        rooms: totalRooms,
        roomType: formattedRoomType,
        roomAllocations: allocationsToStore as any,
        roomPricing: data.roomPricing && data.roomPricing.length > 0 ? (data.roomPricing as any) : null,
        mealSelections: data.mealSelections && data.mealSelections.length > 0 ? (data.mealSelections as any) : null,
        totalAmount: Number(data.totalAmount),
        gstAmount: Number(data.gstAmount),
        advanceAmount: Number(data.advanceAmount),
        paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
        bookingSource: data.bookingSource || BookingSource.WHATSAPP,
        travelAgent: data.bookingSource === BookingSource.TRAVEL_AGENT ? (data.travelAgent || null) : null,
        includeInExcel: data.includeInExcel !== undefined ? Boolean(data.includeInExcel) : true,
        notes: data.notes ? data.notes.trim() : null,
      },
    });

    try {
      revalidatePath("/bookings");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      bookingId: newBooking.id,
      message: "Booking successfully created!",
    };
  } catch (error: unknown) {
    console.error("Error creating booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save booking to database.";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateBooking(id: string, data: BookingFormData): Promise<ActionResult> {
  const errors: Record<string, string> = {};

  if (!data.hotelId || data.hotelId.trim() === "") {
    errors.hotelId = "Please select a hotel.";
  }

  if (!data.guestName || data.guestName.trim() === "") {
    errors.guestName = "Guest name is required.";
  } else if (data.guestName.trim().length < 2) {
    errors.guestName = "Guest name must be at least 2 characters.";
  }

  // Phone validation
  if (data.guestPhone && data.guestPhone.trim() !== "") {
    const rawDigits = data.guestPhone.replace(/\D/g, "");
    const tenDigits = rawDigits.startsWith("91") && rawDigits.length === 12
      ? rawDigits.slice(2)
      : rawDigits;
    if (tenDigits.length !== 10) {
      errors.guestPhone = "Please enter a valid 10-digit mobile number.";
    }
  }

  if (!data.bookingId || data.bookingId.trim() === "") {
    errors.bookingId = "Booking ID is required.";
  }

  if (!data.checkIn || data.checkIn.trim() === "") {
    errors.checkIn = "Check-in date is required.";
  }

  if (!data.checkOut || data.checkOut.trim() === "") {
    errors.checkOut = "Check-out date is required.";
  }

  if (data.checkIn && data.checkOut) {
    const inDate = new Date(data.checkIn);
    const outDate = new Date(data.checkOut);
    if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate < inDate) {
      errors.checkOut = "Check-out date cannot be before check-in date.";
    }
  }

  if (data.adults === undefined || isNaN(Number(data.adults)) || Number(data.adults) < 1) {
    errors.adults = "Adults must be at least 1.";
  }

  if (data.children === undefined || isNaN(Number(data.children)) || Number(data.children) < 0) {
    errors.children = "Children must be 0 or greater.";
  }

  if (data.rooms === undefined || isNaN(Number(data.rooms)) || Number(data.rooms) < 1) {
    errors.rooms = "Number of rooms must be at least 1.";
  }

  if (data.totalAmount === undefined || isNaN(Number(data.totalAmount)) || Number(data.totalAmount) < 0) {
    errors.totalAmount = "Total amount must be a valid non-negative number.";
  }

  if (data.gstAmount === undefined || isNaN(Number(data.gstAmount)) || Number(data.gstAmount) < 0) {
    errors.gstAmount = "GST amount must be a valid non-negative number.";
  }

  if (data.advanceAmount === undefined || isNaN(Number(data.advanceAmount)) || Number(data.advanceAmount) < 0) {
    errors.advanceAmount = "Advance amount must be a valid non-negative number.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
      message: "Please correct the highlighted errors.",
    };
  }

  try {
    const trimmedBookingId = data.bookingId.trim();

    // Check for duplicate Booking ID on other bookings
    const duplicate = await prisma.booking.findFirst({
      where: {
        bookingId: trimmedBookingId,
        id: { not: id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        errors: {
          bookingId: `Booking ID "${trimmedBookingId}" is already used by another booking.`,
        },
        message: "Duplicate booking ID detected.",
      };
    }

    // Normalize guest name with proper word capitalization
    let cleanGuestName = capitalizeGuestName(data.guestName || "");
    if (data.guestTitle && cleanGuestName) {
      const titleClean = data.guestTitle.replace(/\./g, "").trim().toLowerCase();
      const words = cleanGuestName.split(/\s+/);
      if (words.length > 1) {
        const firstWordClean = words[0].replace(/\./g, "").trim().toLowerCase();
        if (firstWordClean === titleClean) {
          cleanGuestName = words.slice(1).join(" ");
        }
      }
    }

    // Handle multiple room allocations or single room type
    let allocationsToStore = data.roomAllocations && data.roomAllocations.length > 0
      ? data.roomAllocations
      : null;
    let totalRooms = Math.floor(Number(data.rooms)) || 1;
    let formattedRoomType = (data.roomType || "Standard").trim();

    if (allocationsToStore && allocationsToStore.length > 0) {
      totalRooms = getTotalRoomCount(allocationsToStore);
      formattedRoomType = formatRoomAllocationsSummary(allocationsToStore);
    } else {
      allocationsToStore = parseRoomAllocations(null, formattedRoomType, totalRooms);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        bookingId: trimmedBookingId,
        hotelId: data.hotelId,
        guestTitle: data.guestTitle || null,
        guestName: cleanGuestName,
        guestPhone: normalizePhone(data.guestPhone || ""),
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        adults: Math.floor(Number(data.adults)),
        children: Math.floor(Number(data.children)),
        rooms: totalRooms,
        roomType: formattedRoomType,
        roomAllocations: allocationsToStore as any,
        roomPricing: data.roomPricing && data.roomPricing.length > 0 ? (data.roomPricing as any) : null,
        mealSelections: data.mealSelections && data.mealSelections.length > 0 ? (data.mealSelections as any) : null,
        totalAmount: Number(data.totalAmount),
        gstAmount: Number(data.gstAmount),
        advanceAmount: Number(data.advanceAmount),
        paymentStatus: data.paymentStatus,
        bookingSource: data.bookingSource,
        travelAgent: data.bookingSource === BookingSource.TRAVEL_AGENT ? (data.travelAgent || null) : null,
        includeInExcel: data.includeInExcel !== undefined ? Boolean(data.includeInExcel) : true,
        notes: data.notes ? data.notes.trim() : null,
      },
    });

    try {
      revalidatePath("/bookings");
      revalidatePath(`/bookings/${id}`);
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      bookingId: updated.id,
      message: "Booking updated successfully!",
    };
  } catch (error: unknown) {
    console.error("Error updating booking:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update booking.",
    };
  }
}

export async function cancelBooking(id: string, reason?: string): Promise<ActionResult> {
  try {
    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason ? reason.trim() : "Cancelled by user",
      },
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${id}`);
    revalidatePath("/");

    return {
      success: true,
      message: "Booking has been cancelled.",
    };
  } catch (error: unknown) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel booking.",
    };
  }
}

export async function restoreBooking(id: string): Promise<ActionResult> {
  try {
    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
        cancelledAt: null,
        cancellationReason: null,
      },
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${id}`);
    revalidatePath("/");

    return {
      success: true,
      message: "Booking has been restored.",
    };
  } catch (error: unknown) {
    console.error("Error restoring booking:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to restore booking.",
    };
  }
}

/**
 * Toggle or update the "Include in Excel" report flag for a booking
 */
export async function updateBookingExcelInclusion(
  id: string,
  includeInExcel: boolean
): Promise<ActionResult> {
  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: { includeInExcel },
    });

    try {
      revalidatePath(`/bookings/${id}`);
      revalidatePath("/bookings");
      revalidatePath("/reports");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      bookingId: updated.id,
      message: `Booking has been ${includeInExcel ? "included in" : "excluded from"} Excel reports.`,
    };
  } catch (error: unknown) {
    console.error("Error updating Excel inclusion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update Excel status.",
    };
  }
}


