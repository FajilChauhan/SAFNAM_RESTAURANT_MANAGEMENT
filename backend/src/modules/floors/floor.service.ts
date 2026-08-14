import fs from "node:fs";
import path from "node:path";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import { ApiError } from "../../utils/ApiError.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { restaurantService } from "../restaurant/restaurant.service.js";
import type { CreateFloorDto, UpdateFloorDto } from "./dto/floor.dto.js";
import { FloorRepository } from "./floor.repository.js";

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

export class FloorService extends BaseService {
  constructor(private readonly floorRepository: FloorRepository) {
    super();
  }

  async create(dto: CreateFloorDto) {
    const restaurant = await restaurantService.ensureSingle();
    const restaurantId = dto.restaurantId ?? restaurant.id;
    const existingFloor = await this.floorRepository.findByRestaurantAndName(restaurantId, dto.name);

    if (existingFloor) {
      throw new ApiError(409, "Floor name already exists for this restaurant", ERROR_CODES.RESOURCE_CONFLICT);
    }

    return this.floorRepository.create({ ...dto, restaurantId });
  }

  list(options: QueryOptions) {
    return this.floorRepository.list(options);
  }

  async update(id: string, dto: UpdateFloorDto) {
    const floor = await this.floorRepository.findById(id);

    if (!floor) {
      throw new ApiError(404, "Floor not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (dto.name && dto.name !== floor.name) {
      const existingFloor = await this.floorRepository.findByRestaurantAndName(floor.restaurantId, dto.name);

      if (existingFloor) {
        throw new ApiError(409, "Floor name already exists for this restaurant", ERROR_CODES.RESOURCE_CONFLICT);
      }
    }

    if (dto.imageUrl !== undefined && dto.imageUrl !== floor.imageUrl) {
      deletePhysicalFile(floor.imageUrl);
    }

    return this.floorRepository.update(id, dto);
  }

  async delete(id: string) {
    const floor = await this.floorRepository.findById(id);
    const existingFloor = this.ensureExists(floor, "Floor not found");

    const tableCount = await this.floorRepository.countTables(id);
    if (tableCount > 0) {
      throw new ApiError(409, "This floor contains tables. Move or remove its tables before deleting the floor.", ERROR_CODES.RESOURCE_CONFLICT);
    }

    deletePhysicalFile(existingFloor.imageUrl);
    await this.floorRepository.delete(id);
  }
}

export const floorService = new FloorService(new FloorRepository());
