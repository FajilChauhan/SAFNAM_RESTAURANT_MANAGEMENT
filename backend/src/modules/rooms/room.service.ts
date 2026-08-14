import fs from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { ApiError } from "../../utils/ApiError.js";
import { restaurantService } from "../restaurant/restaurant.service.js";
import type { CreateRoomDto, UpdateRoomDto } from "./dto/room.dto.js";
import { RoomRepository } from "./room.repository.js";

function deletePhysicalFile(relativeUrl: string | null | undefined) {
  try {
    if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) return;
    const relativePath = relativeUrl.replace(/^\/uploads\//, "");
    const absolutePath = path.resolve("uploads", relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error("Failed to delete physical file:", error);
  }
}

export class RoomService extends BaseService {
  constructor(private readonly roomRepository: RoomRepository) {
    super();
  }

  async create(dto: CreateRoomDto) {
    const restaurant = await restaurantService.ensureSingle();
    const existingRoom = await this.roomRepository.findByRoomNumber(dto.roomNumber);

    if (existingRoom) {
      throw new ApiError(409, "Room number already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }

    return this.roomRepository.create({
      ...dto,
      restaurantId: dto.restaurantId ?? restaurant.id,
      pricePerDay: new Prisma.Decimal(dto.pricePerDay),
    });
  }

  list(options: QueryOptions) {
    return this.roomRepository.list(options);
  }

  async update(id: string, dto: UpdateRoomDto) {
    const room = await this.roomRepository.findById(id);

    if (!room) {
      throw new ApiError(404, "Room not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (dto.roomNumber && dto.roomNumber !== room.roomNumber) {
      const existingRoom = await this.roomRepository.findByRoomNumber(dto.roomNumber);

      if (existingRoom) {
        throw new ApiError(409, "Room number already exists", ERROR_CODES.RESOURCE_CONFLICT);
      }
    }

    // If imageUrl changed, delete the old physical file
    if (dto.imageUrl !== undefined && dto.imageUrl !== room.imageUrl) {
      deletePhysicalFile(room.imageUrl);
    }

    return this.roomRepository.update(id, {
      ...dto,
      pricePerDay: dto.pricePerDay === undefined ? undefined : new Prisma.Decimal(dto.pricePerDay),
    });
  }

  async delete(id: string) {
    const maybeRoom = await this.roomRepository.findById(id);
    const room = this.ensureExists(maybeRoom, "Room not found");

    // Check for bookings before deletion
    const bookingsCount = await this.roomRepository.countBookings(id);
    if (bookingsCount > 0) {
      throw new ApiError(
        409,
        "This room has booking history. Deactivate it instead of deleting.",
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    deletePhysicalFile(room.imageUrl);
    await this.roomRepository.delete(id);
  }
}

export const roomService = new RoomService(new RoomRepository());
