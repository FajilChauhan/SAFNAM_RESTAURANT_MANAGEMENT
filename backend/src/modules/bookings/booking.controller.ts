import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseApiQuery } from "../../utils/queryParser.js";
import { uuidSchema } from "../../utils/validator.js";
import { bookingService } from "./booking.service.js";
import {
  availabilityQuerySchema,
  createBookingSchema,
  updateBookingSchema,
} from "./validators/booking.validator.js";

class BookingController extends BaseController {
  create = asyncHandler(async (req, res) => {
    const dto = createBookingSchema.parse(req.body);
    const booking = await bookingService.create(dto, req.user!);

    this.created(res, "Booking created successfully", { booking });
  });

  update = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const dto = updateBookingSchema.parse(req.body);
    const booking = await bookingService.update(id, dto);

    this.ok(res, "Booking updated successfully", { booking });
  });

  cancel = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const booking = await bookingService.cancel(id);

    this.ok(res, "Booking cancelled successfully", { booking });
  });

  checkIn = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const booking = await bookingService.checkIn(id);

    this.ok(res, "Booking checked in successfully", { booking });
  });

  checkOut = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const booking = await bookingService.checkOut(id);

    this.ok(res, "Booking checked out successfully", { booking });
  });

  get = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const booking = await bookingService.getById(id);
    
    // Mask Aadhaar if customer
    if (req.user?.role === "CUSTOMER" && booking.guests) {
      booking.guests = booking.guests.map((g) => ({
        ...g,
        aadhaarNumber: `XXXX-XXXX-${g.aadhaarNumber.slice(-4)}`,
      }));
    }

    this.ok(res, "Booking fetched successfully", { booking });
  });

  list = asyncHandler(async (req, res) => {
    const options = parseApiQuery(req.query, [
      "customerId",
      "bookingType",
      "status",
      "source",
      "tableId",
      "roomId",
    ]);
    const result = await bookingService.list(options);

    // Mask Aadhaar for everyone in lists/grids
    result.data = result.data.map((b: any) => {
      if (b.guests) {
        b.guests = b.guests.map((g: any) => ({
          ...g,
          aadhaarNumber: `XXXX-XXXX-${g.aadhaarNumber.slice(-4)}`,
        }));
      }
      return b;
    });

    this.ok(res, "Bookings fetched successfully", { bookings: result.data }, result.meta);
  });

  availableTables = asyncHandler(async (req, res) => {
    const dto = availabilityQuerySchema.parse(req.query);
    const tables = await bookingService.getAvailableTables(dto);

    this.ok(res, "Available tables fetched successfully", { tables });
  });

  availableRooms = asyncHandler(async (req, res) => {
    const dto = availabilityQuerySchema.parse(req.query);
    const rooms = await bookingService.getAvailableRooms(dto);

    this.ok(res, "Available rooms fetched successfully", { rooms });
  });

  activeReward = asyncHandler(async (req, res) => {
    const customerId = uuidSchema.parse(req.params.customerId);
    const reward = await prisma.gameReward.findFirst({
      where: {
        customerId,
        status: "ACTIVE",
        expiresAt: { gte: new Date() },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
    this.ok(res, "Active reward fetched successfully", { reward });
  });

  eligibleOffers = asyncHandler(async (req, res) => {
    const { bookingType, tableId, roomId } = z.object({
      bookingType: z.enum(["TABLE", "ROOM"]),
      tableId: z.string().uuid().optional(),
      roomId: z.string().uuid().optional(),
    }).parse(req.query);

    const offers = await bookingService.getEligibleOffers({
      bookingType,
      tableId,
      roomId,
    });

    this.ok(res, "Eligible offers fetched successfully", { offers });
  });
}

export const bookingController = new BookingController();
