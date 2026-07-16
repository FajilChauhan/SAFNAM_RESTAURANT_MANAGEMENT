import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateRestaurantDto, UpdateRestaurantDto } from "./dto/restaurant.dto.js";
import { RestaurantRepository } from "./restaurant.repository.js";

export class RestaurantService extends BaseService {
  constructor(private readonly restaurantRepository: RestaurantRepository) {
    super();
  }

  create(dto: CreateRestaurantDto) {
    return this.restaurantRepository.create(dto);
  }

  async getById(id: string) {
    const restaurant = await this.restaurantRepository.findById(id);
    return this.ensureExists(restaurant, "Restaurant not found");
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.restaurantRepository.findById(id);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return this.restaurantRepository.update(id, dto);
  }
}

export const restaurantService = new RestaurantService(new RestaurantRepository());
