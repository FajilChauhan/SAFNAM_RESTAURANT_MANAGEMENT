import { PrismaClient, TableShape, TableStatus, RoomStatus } from "@prisma/client";
import { hashPassword } from "../../src/utils/password.js";

const prisma = new PrismaClient();

const main = async () => {
  const admin = await prisma.user.upsert({
    where: { phoneNumber: "9999999999" },
    update: {},
    create: {
      fullName: "SAFNAM Admin",
      phoneNumber: "9999999999",
      email: "admin@safnam.local",
      passwordHash: await hashPassword("Admin@12345"),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "SAFNAM Restaurant",
      phone: "9999999999",
      email: "hello@safnam.local",
      address: "SAFNAM Main Branch",
      openingTime: "08:00",
      closingTime: "23:00",
      currency: "INR",
      timezone: "Asia/Kolkata",
      createdBy: admin.id,
    },
  });

  const groundFloor = await prisma.floor.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Ground Floor" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "Ground Floor", displayOrder: 1, createdBy: admin.id },
  });

  const firstFloor = await prisma.floor.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "First Floor" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "First Floor", displayOrder: 2, createdBy: admin.id },
  });

  for (const table of [
    { floorId: groundFloor.id, tableNumber: "G1", capacity: 4 },
    { floorId: groundFloor.id, tableNumber: "G2", capacity: 6 },
    { floorId: firstFloor.id, tableNumber: "F1", capacity: 4 },
  ]) {
    await prisma.diningTable.upsert({
      where: { tableNumber: table.tableNumber },
      update: {},
      create: { ...table, shape: TableShape.RECTANGLE, status: TableStatus.AVAILABLE, createdBy: admin.id },
    });
  }

  for (const room of [
    { roomNumber: "101", roomType: "Standard", capacity: 2, pricePerDay: "2500" },
    { roomNumber: "102", roomType: "Deluxe", capacity: 3, pricePerDay: "3500" },
  ]) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: { ...room, restaurantId: restaurant.id, status: RoomStatus.AVAILABLE, createdBy: admin.id },
    });
  }

  for (const [index, name] of ["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts", "Drinks"].entries()) {
    await prisma.menuCategory.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name } },
      update: {},
      create: { restaurantId: restaurant.id, name, displayOrder: index + 1, createdBy: admin.id },
    });
  }
};

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
