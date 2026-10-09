/**
 * Canonical booking enums and types for WellKnown Booking System.
 * Defined here to ensure 100% type safety and compatibility across
 * both server components/actions and client components without relying
 * on internal @prisma/client re-export quirks in TypeScript editors.
 */

export const PaymentStatus = {
  PENDING: "PENDING",
  ADVANCE_PAYMENT_DUE: "ADVANCE_PAYMENT_DUE",
  ADVANCE_PAID: "ADVANCE_PAID",
  FULLY_PAID: "FULLY_PAID",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BookingSource = {
  WHATSAPP: "WHATSAPP",
  PHONE: "PHONE",
  WEBSITE: "WEBSITE",
  OFFLINE: "OFFLINE",
  OTHER: "OTHER",
  TRAVEL_AGENT: "TRAVEL_AGENT",
} as const;

export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const BookingStatus = {
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export interface RoomAllocation {
  roomType: string;
  count: number;
}
