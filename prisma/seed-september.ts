import { PrismaClient, PaymentStatus, BookingSource, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hotels = await prisma.hotel.findMany();
  const dwarka = hotels.find((h) => h.name.toLowerCase().includes("dwarka"));
  const nathdwara = hotels.find((h) => h.name.toLowerCase().includes("nathdwara"));
  const saputara = hotels.find((h) => h.name.toLowerCase().includes("saputara"));

  if (!dwarka || !nathdwara || !saputara) {
    console.error("Hotels not found!");
    return;
  }

  const sampleBookings = [
    // Dwarka
    {
      bookingId: "DWK-2609-001",
      hotelId: dwarka.id,
      guestName: "Mr. Shailesh Trivedi",
      guestPhone: "+91 98250 12345",
      checkIn: new Date("2026-09-05T12:00:00Z"),
      checkOut: new Date("2026-09-07T10:00:00Z"),
      adults: 2,
      children: 0,
      rooms: 1,
      roomType: "Deluxe AC",
      totalAmount: 5000,
      gstAmount: 600,
      advanceAmount: 2000,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.WHATSAPP,
      status: BookingStatus.CONFIRMED,
      notes: "Early check-in requested if available.",
    },
    {
      bookingId: "DWK-2609-002",
      hotelId: dwarka.id,
      guestName: "Mrs. Meena Patel",
      guestPhone: "+91 94260 54321",
      checkIn: new Date("2026-09-12T12:00:00Z"),
      checkOut: new Date("2026-09-14T10:00:00Z"),
      adults: 4,
      children: 1,
      rooms: 2,
      roomType: "Super Deluxe AC",
      totalAmount: 9000,
      gstAmount: 1080,
      advanceAmount: 4000,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.PHONE,
      status: BookingStatus.CONFIRMED,
      notes: "Adjoining rooms preferred.",
    },
    {
      bookingId: "DWK-2609-003",
      hotelId: dwarka.id,
      guestName: "Mr. Jayesh Joshi",
      guestPhone: "+91 97123 45678",
      checkIn: new Date("2026-09-18T12:00:00Z"),
      checkOut: new Date("2026-09-19T10:00:00Z"),
      adults: 2,
      children: 0,
      rooms: 1,
      roomType: "Standard AC",
      totalAmount: 2800,
      gstAmount: 336,
      advanceAmount: 2800,
      paymentStatus: PaymentStatus.FULLY_PAID,
      bookingSource: BookingSource.OFFLINE,
      status: BookingStatus.CONFIRMED,
      notes: "Full payment received at counter.",
    },
    {
      bookingId: "DWK-2609-004",
      hotelId: dwarka.id,
      guestName: "Mr. Rohit Verma",
      guestPhone: "+91 98980 99887",
      checkIn: new Date("2026-09-22T12:00:00Z"),
      checkOut: new Date("2026-09-24T10:00:00Z"),
      adults: 2,
      children: 0,
      rooms: 1,
      roomType: "Deluxe AC",
      totalAmount: 4800,
      gstAmount: 576,
      advanceAmount: 1500,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.WEBSITE,
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date("2026-09-20T14:30:00Z"),
      cancellationReason: "Guest personal travel plan cancelled",
      notes: "Advance 50% refund issued.",
    },

    // Nathdwara
    {
      bookingId: "NAT-2609-001",
      hotelId: nathdwara.id,
      guestName: "Mr. Ramesh Agarwal",
      guestPhone: "+91 98290 11223",
      checkIn: new Date("2026-09-08T12:00:00Z"),
      checkOut: new Date("2026-09-10T10:00:00Z"),
      adults: 3,
      children: 0,
      rooms: 1,
      roomType: "Executive AC",
      totalAmount: 6500,
      gstAmount: 780,
      advanceAmount: 2500,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.WHATSAPP,
      status: BookingStatus.CONFIRMED,
      notes: "Darshan pass assistance requested.",
    },
    {
      bookingId: "NAT-2609-002",
      hotelId: nathdwara.id,
      guestName: "Mrs. Sunita Sharma",
      guestPhone: "+91 94140 33445",
      checkIn: new Date("2026-09-15T12:00:00Z"),
      checkOut: new Date("2026-09-16T10:00:00Z"),
      adults: 2,
      children: 1,
      rooms: 1,
      roomType: "Deluxe AC",
      totalAmount: 3200,
      gstAmount: 384,
      advanceAmount: 1500,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.PHONE,
      status: BookingStatus.CONFIRMED,
      notes: "Ground floor room requested.",
    },

    // Saputara
    {
      bookingId: "SAP-2609-001",
      hotelId: saputara.id,
      guestName: "Mr. Krunal Desai",
      guestPhone: "+91 99240 88776",
      checkIn: new Date("2026-09-10T12:00:00Z"),
      checkOut: new Date("2026-09-12T10:00:00Z"),
      adults: 2,
      children: 0,
      rooms: 1,
      roomType: "Golden AC",
      totalAmount: 6000,
      gstAmount: 720,
      advanceAmount: 2500,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.WHATSAPP,
      status: BookingStatus.CONFIRMED,
      notes: "Lake view room requested.",
    },
    {
      bookingId: "SAP-2609-002",
      hotelId: saputara.id,
      guestName: "Mr. Hardik Bhatt",
      guestPhone: "+91 98241 55667",
      checkIn: new Date("2026-09-20T12:00:00Z"),
      checkOut: new Date("2026-09-21T10:00:00Z"),
      adults: 2,
      children: 1,
      rooms: 1,
      roomType: "Silver Non AC",
      totalAmount: 2500,
      gstAmount: 300,
      advanceAmount: 1000,
      paymentStatus: PaymentStatus.ADVANCE_PAID,
      bookingSource: BookingSource.OFFLINE,
      status: BookingStatus.CONFIRMED,
      notes: "Late check-in around 8 PM.",
    },
  ];

  for (const b of sampleBookings) {
    await prisma.booking.upsert({
      where: { bookingId: b.bookingId },
      update: b,
      create: b,
    });
    console.log(`Upserted booking: ${b.bookingId} (${b.guestName})`);
  }

  console.log("Seeding September 2026 bookings completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
