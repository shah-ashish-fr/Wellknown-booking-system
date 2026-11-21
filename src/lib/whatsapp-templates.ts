import { PaymentStatus, BookingSource, BookingStatus, RoomAllocation, RoomPricing, MealSelection } from "@/types/booking";
import { parseRoomAllocations } from "./room-allocations";
import {
  formatDateWithWeekday,
  formatDateLongWithWeekday,
  formatCurrency,
  formatGuestFullName,
} from "./formatters";

export interface BookingTemplateData {
  bookingId: string;
  guestTitle?: string | null;
  guestName: string;
  guestPhone?: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  adults: number;
  children: number;
  rooms: number;
  roomType: string;
  roomAllocations?: RoomAllocation[] | null;
  roomPricing?: RoomPricing[] | null;
  mealSelections?: MealSelection[] | null;
  totalAmount: number;
  gstAmount: number;
  advanceAmount: number;
  paymentStatus: PaymentStatus;
  bookingSource: BookingSource;
  travelAgent?: string | null;
  status?: BookingStatus;
  notes?: string | null;
  hotel: {
    name: string;
    location: string;
  };
}

export function formatPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.FULLY_PAID:
      return "Fully Paid (Settled in full)";
    case PaymentStatus.ADVANCE_PAID:
      return "Advance Paid";
    case PaymentStatus.ADVANCE_PAYMENT_DUE:
      return "Advance Payment Due";
    case PaymentStatus.REFUNDED:
      return "Refunded";
    case PaymentStatus.PENDING:
    default:
      return "Pending (Pay at Hotel)";
  }
}

function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return 1;
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export interface HotelContactInfo {
  mapsUrl: string;
  phone: string;
  reception?: string;
  emergencyOwner?: string;
}

export const HOTEL_CONTACT_DIRECTORY: Record<string, HotelContactInfo> = {
  shivansh: {
    mapsUrl: "https://maps.app.goo.gl/i3aVyHLHWpbuXBAT8",
    phone: "+91 76000 30080",
    reception: "+91 80588 77468",
  },
  kesari: {
    mapsUrl: "https://maps.app.goo.gl/hfb2guRuUGtyYYzNA",
    phone: "+91 99740 89159",
    reception: "+91 95741 30505",
  },
  manas: {
    mapsUrl: "https://maps.app.goo.gl/xYmVyuvknaAq6SoH7",
    phone: "+91 76000 30080",
    emergencyOwner: "+91 98984 27347",
  },
};

export function getHotelContactInfo(hotelName?: string, location?: string): HotelContactInfo | null {
  const query = `${hotelName || ""} ${location || ""}`.toLowerCase();
  if (query.includes("shivansh") || query.includes("nathdwara")) {
    return HOTEL_CONTACT_DIRECTORY.shivansh;
  }
  if (query.includes("kesari") || query.includes("nandan") || query.includes("dwarka")) {
    return HOTEL_CONTACT_DIRECTORY.kesari;
  }
  if (query.includes("manas") || query.includes("saputara")) {
    return HOTEL_CONTACT_DIRECTORY.manas;
  }
  return null;
}

/**
 * WhatsApp operational recipient contact numbers for sending Hotel Confirmations to the hotel desks:
 * • Hotel Shivansh — Nathdwara → +91 88660 07770
 * • Manas Homestay — Saputara → +91 88660 07770
 * • Hotel Shree Kesari Nandan — Dwarka → +91 95741 30505
 */
export interface HotelWhatsAppRecipient {
  displayPhone: string;
  waNumber: string;
}

export function getHotelWhatsAppRecipient(hotelName?: string, location?: string): HotelWhatsAppRecipient {
  const query = `${hotelName || ""} ${location || ""}`.toLowerCase();

  // Hotel Shree Kesari Nandan — Dwarka → +91 95741 30505
  if (query.includes("kesari") || query.includes("nandan") || query.includes("dwarka")) {
    return {
      displayPhone: "+91 95741 30505",
      waNumber: "919574130505",
    };
  }

  // Manas Homestay — Saputara → +91 88660 07770
  if (query.includes("manas") || query.includes("saputara")) {
    return {
      displayPhone: "+91 88660 07770",
      waNumber: "918866007770",
    };
  }

  // Hotel Shivansh — Nathdwara → +91 88660 07770
  if (query.includes("shivansh") || query.includes("nathdwara")) {
    return {
      displayPhone: "+91 88660 07770",
      waNumber: "918866007770",
    };
  }

  return {
    displayPhone: "+91 88660 07770",
    waNumber: "918866007770",
  };
}

/**
 * Generate a friendly, professional booking confirmation message formatted for WhatsApp to send to the GUEST.
 */
export function generateGuestConfirmation(booking: BookingTemplateData): string {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const grandTotal = booking.totalAmount + booking.gstAmount;
  const balanceDue = Math.max(0, grandTotal - booking.advanceAmount);
  const nightsText = `${nights} ${nights === 1 ? "Night" : "Nights"}`;

  const childrenText = booking.children > 0 ? `, ${booking.children} ${booking.children === 1 ? "Child" : "Children"}` : "";
  const allocations = parseRoomAllocations(booking.roomAllocations, booking.roomType, booking.rooms);

  // Check if room-wise pricing exists
  const pricingList: RoomPricing[] = Array.isArray(booking.roomPricing) ? booking.roomPricing : [];
  const hasRoomPricing = pricingList.length > 0 && pricingList.some((p) => (p.pricePerNight || 0) > 0);

  let roomsText = "";
  if (hasRoomPricing) {
    if (pricingList.length > 1) {
      roomsText = `${booking.rooms} Rooms\n` + pricingList.map((p) => {
        const pSubtotal = p.subtotal || (p.count * p.pricePerNight * nights);
        return `  • ${p.count} × ${p.roomType} @ ${formatCurrency(p.pricePerNight)}/night (${nightsText} = ${formatCurrency(pSubtotal)})`;
      }).join("\n");
    } else {
      const p = pricingList[0];
      const pSubtotal = p.subtotal || (p.count * p.pricePerNight * nights);
      roomsText = `${booking.rooms} ${booking.rooms === 1 ? "Room" : "Rooms"} (${p.roomType}) @ ${formatCurrency(p.pricePerNight)}/night (${nightsText} = ${formatCurrency(pSubtotal)})`;
    }
  } else if (allocations.length > 1) {
    roomsText = `${booking.rooms} Rooms\n` + allocations.map((a) => `  • ${a.count} × ${a.roomType}`).join("\n");
  } else if (allocations.length === 1) {
    roomsText = `${booking.rooms} ${booking.rooms === 1 ? "Room" : "Rooms"} (${allocations[0].roomType})`;
  } else {
    roomsText = `${booking.rooms} ${booking.rooms === 1 ? "Room" : "Rooms"} (${booking.roomType})`;
  }
  const guestDisplayName = formatGuestFullName(booking.guestTitle, booking.guestName);

  let message = `*BOOKING CONFIRMATION* 🏨\n`;
  message += `*${booking.hotel.name}*\n`;
  message += `*Managed by WellKnown Hospitality Services*\n\n`;
  message += `Dear *${guestDisplayName}*,\n`;
  message += `Greetings! We are pleased to confirm your reservation at *${booking.hotel.name}*.\n\n`;

  message += `📋 *Reservation Details:*\n`;
  message += `• *Booking ID:* ${booking.bookingId}\n`;
  message += `• *Hotel:* ${booking.hotel.name} (${booking.hotel.location})\n`;
  message += `• *Check-in:* ${formatDateWithWeekday(booking.checkIn)}\n`;
  message += `• *Check-out:* ${formatDateWithWeekday(booking.checkOut)} (${nightsText})\n`;
  message += `• *Rooms:* ${roomsText}\n`;
  message += `• *Guests:* ${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}${childrenText}\n\n`;

  // Meals section (Hotel Shree Kesari Nandan or when mealSelections exist)
  const mealsList: MealSelection[] = Array.isArray(booking.mealSelections) ? booking.mealSelections : [];
  const totalMealCharges = mealsList.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  if (mealsList.length > 0) {
    message += `🍽️ *Meal Options:*\n`;
    for (const m of mealsList) {
      const daysText = `${m.numberOfDays} ${m.numberOfDays === 1 ? "day" : "days"}`;
      message += `• *${m.mealType}:* ${formatCurrency(m.pricePerPerson)} × ${m.numberOfPeople} ${m.numberOfPeople === 1 ? "person" : "people"} × ${daysText} = ${formatCurrency(m.subtotal)}\n`;
    }
    message += `• *Total Meal Charges:* ${formatCurrency(totalMealCharges)}\n\n`;
  }

  // Calculate room total if room pricing exists
  const totalRoomCharges = hasRoomPricing ? pricingList.reduce((sum, p) => sum + (p.subtotal || 0), 0) : 0;

  message += `💳 *Payment Summary:*\n`;
  if (hasRoomPricing && totalMealCharges > 0) {
    message += `• *Room Charges:* ${formatCurrency(totalRoomCharges)}\n`;
    message += `• *Meal Charges:* ${formatCurrency(totalMealCharges)}\n`;
  }
  message += `• *Total Amount:* ${formatCurrency(grandTotal)}${booking.gstAmount > 0 ? " (incl. GST)" : ""}\n`;
  message += `• *Advance Paid:* ${formatCurrency(booking.advanceAmount)}\n`;
  if (balanceDue > 0) {
    message += `• *Balance Due:* ${formatCurrency(balanceDue)} (payable at check-in)\n`;
  } else {
    message += `• *Balance Due:* Nil (Fully Settled)\n`;
  }
  message += `• *Payment Status:* ${formatPaymentStatusLabel(booking.paymentStatus)}\n`;

  if (booking.notes && booking.notes.trim()) {
    message += `\n📝 *Special Notes / Requests:*\n`;
    message += `${booking.notes.trim()}\n`;
  }

  const contact = getHotelContactInfo(booking.hotel?.name, booking.hotel?.location);
  if (contact) {
    message += `\n📍 *Hotel Location:*\n`;
    message += `${contact.mapsUrl}\n\n`;
    message += `📞 *Hotel Contact:*\n`;
    if (contact.phone) {
      message += `• *Phone:* ${contact.phone}\n`;
    }
    if (contact.reception) {
      message += `• *Reception:* ${contact.reception}\n`;
    }
    if (contact.emergencyOwner) {
      message += `• *Owner — Emergency Only:* ${contact.emergencyOwner}\n`;
    }
  }

  message += `\n*IMPORTANT INFORMATION & GUEST GUIDELINES*\n`;
  message += `1. *Valid ID Proof:* Carrying an original Aadhaar Card or other valid government-issued photo ID is mandatory for all guests at the time of check-in.\n`;
  message += `2. *Early Check-in:* Early check-in is subject to room availability and may involve additional charges. It cannot be guaranteed in advance.\n`;
  message += `3. *Cancellation Policy:* Cancellations made at least 7 days before the check-in date are eligible for a 100% refund. Cancellations made within 7 days of check-in are subject to the hotel's cancellation policy.\n`;

  message += `\nWe look forward to hosting you! For any queries or modifications, please reply to this WhatsApp message.\n`;
  message += `_Safe travels & have a wonderful stay!_ ✨`;

  return message;
}

export function formatBookingSourceLabel(source: BookingSource, travelAgent?: string | null): string {
  switch (source) {
    case BookingSource.PHONE:
      return "Phone";
    case BookingSource.WHATSAPP:
      return "WhatsApp";
    case BookingSource.WEBSITE:
      return "Website";
    case BookingSource.OFFLINE:
      return "Offline";
    case BookingSource.TRAVEL_AGENT:
      return travelAgent ? `Travel Agent (${travelAgent})` : "Travel Agent";
    case BookingSource.OTHER:
    default:
      return "Other";
  }
}

export function formatSimplePaymentStatus(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.FULLY_PAID:
      return "Fully Paid";
    case PaymentStatus.ADVANCE_PAID:
      return "Advance Paid";
    case PaymentStatus.ADVANCE_PAYMENT_DUE:
      return "Advance Payment Due";
    case PaymentStatus.REFUNDED:
      return "Refunded";
    case PaymentStatus.PENDING:
    default:
      return "Pending";
  }
}

/**
 * Generate an operational booking confirmation message formatted for WhatsApp to send to the HOTEL desk.
 */
export function generateHotelConfirmation(booking: BookingTemplateData): string {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const grandTotal = booking.totalAmount + booking.gstAmount;
  const balanceDue = Math.max(0, grandTotal - booking.advanceAmount);
  const totalNights = Math.max(1, nights);
  const totalRoomNights = Math.max(1, (booking.rooms || 1) * totalNights);
  const ratePerNight = Math.round(booking.totalAmount / totalRoomNights);

  const durationText = `${nights} ${nights === 1 ? "Night" : "Nights"}`;
  const guestsText =
    booking.children > 0
      ? `${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}, ${booking.children} ${booking.children === 1 ? "Child" : "Children"}`
      : `${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}`;

  const guestDisplayName = formatGuestFullName(booking.guestTitle, booking.guestName);
  const separator = "━━━━━━━━━━━━━━━━━━";

  let message = `🏨 *BOOKING CONFIRMATION — ${booking.hotel.name.toUpperCase()}*\n\n`;
  message += `*WellKnown Hospitality Services*\n\n`;
  message += `${separator}\n\n`;

  message += `📋 *BOOKING DETAILS*\n\n`;
  message += `• *Booking ID:* ${booking.bookingId}\n`;
  message += `• *Booking Source:* ${formatBookingSourceLabel(booking.bookingSource, booking.travelAgent)}\n`;
  message += `• *Guest Name:* ${guestDisplayName}\n`;
  message += `• *Contact No.:* ${booking.guestPhone || "Not provided"}\n\n`;

  message += `📅 *STAY DETAILS*\n\n`;
  message += `• *Check-in:* ${formatDateLongWithWeekday(booking.checkIn)}\n`;
  message += `• *Check-out:* ${formatDateLongWithWeekday(booking.checkOut)}\n`;
  message += `• *Duration:* ${durationText}\n`;
  message += `• *Guests:* ${guestsText}\n`;
  const hotelAllocations = parseRoomAllocations(booking.roomAllocations, booking.roomType, booking.rooms);

  // Check if room-wise pricing exists
  const pricingList: RoomPricing[] = Array.isArray(booking.roomPricing) ? booking.roomPricing : [];
  const hasRoomPricing = pricingList.length > 0 && pricingList.some((p) => (p.pricePerNight || 0) > 0);

  message += `• *Rooms:* ${booking.rooms}\n`;
  if (hasRoomPricing) {
    message += `• *Room Allocation & Rates:*\n` + pricingList.map((p) => {
      const pSubtotal = p.subtotal || (p.count * p.pricePerNight * totalNights);
      return `  • ${p.count} × ${p.roomType} @ ${formatCurrency(p.pricePerNight)}/night (${p.nights || totalNights}N = ${formatCurrency(pSubtotal)})`;
    }).join("\n") + `\n\n`;
  } else if (hotelAllocations.length > 1) {
    message += `• *Room Allocation:*\n` + hotelAllocations.map((a) => `  • ${a.count} × ${a.roomType}`).join("\n") + `\n\n`;
  } else {
    message += `• *Room Type:* ${booking.roomType}\n\n`;
  }

  // Meal requirements for hotel staff
  const mealsList: MealSelection[] = Array.isArray(booking.mealSelections) ? booking.mealSelections : [];
  const totalMealCharges = mealsList.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  if (mealsList.length > 0) {
    message += `🍽️ *MEAL REQUIREMENTS*\n\n`;
    for (const m of mealsList) {
      const daysText = `${m.numberOfDays} ${m.numberOfDays === 1 ? "day" : "days"}`;
      message += `• *${m.mealType}:* For ${m.numberOfPeople} Guests × ${daysText} (${formatCurrency(m.pricePerPerson)}/person = ${formatCurrency(m.subtotal)})\n`;
    }
    message += `• *Total Meal Charges:* ${formatCurrency(totalMealCharges)}\n\n`;
  }

  message += `💰 *PAYMENT DETAILS*\n\n`;
  if (hasRoomPricing) {
    const totalRoomCharges = pricingList.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    message += `• *Room Charges:* ${formatCurrency(totalRoomCharges)}\n`;
  } else {
    message += `• *Room Rate:* ${formatCurrency(ratePerNight)} / Night\n`;
  }
  if (totalMealCharges > 0) {
    message += `• *Meal Charges:* ${formatCurrency(totalMealCharges)}\n`;
  }
  message += `• *Total Amount:* ${formatCurrency(grandTotal)}\n`;
  message += `• *Advance Received:* ${formatCurrency(booking.advanceAmount)}\n`;
  message += `• *Balance Payable:* ${formatCurrency(balanceDue)}\n`;
  message += `• *Payment Status:* ${formatSimplePaymentStatus(booking.paymentStatus)}\n\n`;

  message += `📝 *OPERATIONAL NOTE*\n\n`;
  if (booking.notes && booking.notes.trim()) {
    message += `${booking.notes.trim()}\n\n`;
  }
  message += `Kindly block the allocated room and arrange the check-in accordingly.\n\n`;
  message += `Please ensure the booking details are noted in your records.\n\n`;

  message += `${separator}\n\n`;
  message += `*Regards,*\n`;
  message += `*WellKnown Hospitality Services*`;

  return message;
}

