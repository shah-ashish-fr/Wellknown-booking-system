import { PrismaClient } from "@prisma/client";

const hotels = [
  { name: "Hotel Shree Kesari Nandan", location: "Dwarka, Gujarat" },
  { name: "Hotel Shivansh", location: "Nathdwara, Rajasthan" },
  { name: "Manas Homestay", location: "Saputara, Gujarat" },
];

async function main() {
  const prisma = new PrismaClient();

  console.log("Seeding database hotels...");

  for (const hotel of hotels) {
    const existing = await prisma.hotel.findFirst({
      where: { name: hotel.name },
    });

    if (!existing) {
      await prisma.hotel.create({ data: hotel });
      console.log(`  Created hotel: ${hotel.name}`);
    } else {
      await prisma.hotel.update({
        where: { id: existing.id },
        data: { location: hotel.location },
      });
      console.log(`  Hotel updated: ${hotel.name} (${hotel.location})`);
    }
  }

  console.log("Seeding complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
