import { Prisma } from "@prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateRoomDto, UpdateRoomDto } from "./dto/room.dto.js";
import { RoomRepository } from "./room.repository.js";

export class RoomService extends BaseService {
  constructor(private readonly roomRepository: RoomRepository) {
    super();
  }

  async create(dto: CreateRoomDto) {
    const existingRoom = await this.roomRepository.findByRoomNumber(dto.roomNumber);

    if (existingRoom) {
      throw new ApiError(409, "Room number already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }

    return this.roomRepository.create({
      ...dto,
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

    return this.roomRepository.update(id, {
      ...dto,
      pricePerDay: dto.pricePerDay === undefined ? undefined : new Prisma.Decimal(dto.pricePerDay),
    });
  }

  async delete(id: string) {
    const room = await this.roomRepository.findById(id);
    this.ensureExists(room, "Room not found");

    await this.roomRepository.delete(id);
  }
}

export const roomService = new RoomService(new RoomRepository());
