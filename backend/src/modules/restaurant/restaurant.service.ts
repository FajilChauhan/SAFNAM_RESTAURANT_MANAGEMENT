import { BaseService } from "../../lib/BaseService.js";
import type { UpdateRestaurantDto } from "./dto/restaurant.dto.js";
import { RestaurantRepository } from "./restaurant.repository.js";

export class RestaurantService extends BaseService {
  constructor(private readonly restaurantRepository: RestaurantRepository) {
    super();
  }

  async getPublicInfo() {
    const restaurant = await this.restaurantRepository.findPublic();
    return restaurant ?? this.restaurantRepository.ensureSingle();
  }

  ensureSingle() {
    return this.restaurantRepository.ensureSingle();
  }

  async updateSingle(dto: UpdateRestaurantDto) {
    await this.ensureSingle();
    return this.restaurantRepository.updateSingle(dto);
  }
}

export const restaurantService = new RestaurantService(new RestaurantRepository());
