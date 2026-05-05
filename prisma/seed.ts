import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const hashedPassword = await bcrypt.hash("password123", 10);
const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  const alice = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "alice@example.com",
      username: "alice_host",
      phone: "0789000001",
      password: hashedPassword,
      role: "HOST",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob@gmail.com",
      username: "bob_guest",
      phone: "0789000002",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: "Carol White",
      email: "carol@gmail.com",
      username: "carol_guest",
      phone: "0789000003",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  console.log("👥 Created users");

  const listing1 = await prisma.listing.create({
    data: {
      title: "Cozy apartment in downtown",
      location: "New York, NY",
      pricePerNight: 120,
      guest: 2,
      type: "APARTMENT",
      amenities: ["WiFi", "Kitchen", "Air conditioning"],
      hostId: alice.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Beach house with ocean view",
      location: "Miami, FL",
      pricePerNight: 250,
      guest: 6,
      type: "HOUSE",
      amenities: ["WiFi", "Pool", "Beach access", "BBQ"],
      hostId: alice.id,
    },
  });

  console.log("🏠 Created listings");

  await prisma.booking.create({
    data: {
      checkIn: new Date("2025-08-01"),
      totalPrice: 480,
      status: "CONFIRMED",
      guestId: bob.id,
      listingId: listing1.id,
    },
  });

  await prisma.booking.create({
    data: {
      checkIn: new Date("2025-09-10"),
      totalPrice: 1250,
      status: "PENDING",
      guestId: carol.id,
      listingId: listing2.id,
    },
  });

  console.log("📅 Created bookings");
  console.log("✅ Seeding complete!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
