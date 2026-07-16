import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import { ApiError } from "../../utils/ApiError.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import type { CreateFloorDto, UpdateFloorDto } from "./dto/floor.dto.js";
import { FloorRepository } from "./floor.repository.js";

export class FloorService extends BaseService {
  constructor(private readonly floorRepository: FloorRepository) {
    super();
  }

  async create(dto: CreateFloorDto) {
    const existingFloor = await this.floorRepository.findByRestaurantAndName(dto.restaurantId, dto.name);

    if (existingFloor) {
      throw new ApiError(409, "Floor name already exists for this restaurant", ERROR_CODES.RESOURCE_CONFLICT);
    }

    return this.floorRepository.create(dto);
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

    return this.floorRepository.update(id, dto);
  }

  async delete(id: string) {
    const floor = await this.floorRepository.findById(id);
    this.ensureExists(floor, "Floor not found");

    await this.floorRepository.delete(id);
  }
}

export const floorService = new FloorService(new FloorRepository());
