import { MenuAvailabilityType, MenuEntityStatus, Prisma } from "@prisma/client";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateAddOnDto,
  CreateAvailabilityDto,
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateVariantDto,
  UpdateAddOnDto,
  UpdateCategoryDto,
  UpdateMenuItemDto,
  UpdateVariantDto,
} from "./dto/menu.dto.js";
import { MenuRepository } from "./menu.repository.js";

export class MenuService extends BaseService {
  constructor(private readonly menuRepository: MenuRepository) {
    super();
  }

  async createCategory(dto: CreateCategoryDto) {
    await this.ensureCategoryNameAvailable(dto.restaurantId, dto.name);
    return this.menuRepository.createCategory(dto);
  }

  listCategories(options: QueryOptions) {
    return this.menuRepository.listCategories(options);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.getCategory(id);
    if (dto.name && dto.name !== category.name) {
      await this.ensureCategoryNameAvailable(category.restaurantId, dto.name);
    }
    return this.menuRepository.updateCategory(id, dto);
  }

  async deleteCategory(id: string) {
    await this.getCategory(id);
    const itemCount = await this.menuRepository.countItemsByCategory(id);
    if (itemCount > 0) {
      throw new ApiError(409, "Category cannot be deleted while menu items exist", ERROR_CODES.RESOURCE_CONFLICT);
    }
    await this.menuRepository.deleteCategory(id);
  }

  async createItem(dto: CreateMenuItemDto) {
    const category = await this.getCategory(dto.categoryId);
    if (category.status !== MenuEntityStatus.ACTIVE) {
      throw new ApiError(400, "Cannot add items to an inactive category");
    }
    await this.ensureItemNameAvailable(dto.categoryId, dto.name);
    return this.menuRepository.createItem({ ...dto, price: new Prisma.Decimal(dto.price) });
  }

  listItems(options: QueryOptions) {
    return this.menuRepository.listItems(options);
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const item = await this.getItem(id);
    const categoryId = dto.categoryId ?? item.categoryId;
    if (dto.name && (dto.name !== item.name || categoryId !== item.categoryId)) {
      await this.ensureItemNameAvailable(categoryId, dto.name);
    }
    if (dto.categoryId) {
      const category = await this.getCategory(dto.categoryId);
      if (category.status !== MenuEntityStatus.ACTIVE) {
        throw new ApiError(400, "Cannot move item to an inactive category");
      }
    }
    return this.menuRepository.updateItem(id, {
      ...dto,
      price: dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
    });
  }

  async softDeleteItem(id: string) {
    await this.getItem(id);
    await this.menuRepository.softDeleteItem(id);
  }

  async setTodaySpecial(id: string, isTodaySpecial: boolean) {
    await this.getItem(id);
    return this.menuRepository.updateItem(id, { isTodaySpecial });
  }

  async setItemAvailability(id: string, isAvailable: boolean) {
    await this.getItem(id);
    return this.menuRepository.updateItem(id, { isAvailable });
  }

  async createVariant(dto: CreateVariantDto) {
    await this.getItem(dto.menuItemId);
    await this.ensureVariantNameAvailable(dto.menuItemId, dto.name);
    return this.menuRepository.createVariant({
      ...dto,
      priceDifference: new Prisma.Decimal(dto.priceDifference ?? 0),
    });
  }

  listVariants(options: QueryOptions) {
    return this.menuRepository.listVariants(options);
  }

  async updateVariant(id: string, dto: UpdateVariantDto) {
    const variant = this.ensureExists(await this.menuRepository.findVariantById(id), "Variant not found");
    if (dto.name && dto.name !== variant.name) {
      await this.ensureVariantNameAvailable(variant.menuItemId, dto.name);
    }
    return this.menuRepository.updateVariant(id, {
      ...dto,
      priceDifference: dto.priceDifference === undefined ? undefined : new Prisma.Decimal(dto.priceDifference),
    });
  }

  async deleteVariant(id: string) {
    this.ensureExists(await this.menuRepository.findVariantById(id), "Variant not found");
    await this.menuRepository.deleteVariant(id);
  }

  async createAddOn(dto: CreateAddOnDto) {
    await this.getItem(dto.menuItemId);
    await this.ensureAddOnNameAvailable(dto.menuItemId, dto.name);
    return this.menuRepository.createAddOn({
      ...dto,
      additionalPrice: new Prisma.Decimal(dto.additionalPrice),
    });
  }

  listAddOns(options: QueryOptions) {
    return this.menuRepository.listAddOns(options);
  }

  async updateAddOn(id: string, dto: UpdateAddOnDto) {
    const addOn = this.ensureExists(await this.menuRepository.findAddOnById(id), "Add-on not found");
    if (dto.name && dto.name !== addOn.name) {
      await this.ensureAddOnNameAvailable(addOn.menuItemId, dto.name);
    }
    return this.menuRepository.updateAddOn(id, {
      ...dto,
      additionalPrice: dto.additionalPrice === undefined ? undefined : new Prisma.Decimal(dto.additionalPrice),
    });
  }

  async deleteAddOn(id: string) {
    this.ensureExists(await this.menuRepository.findAddOnById(id), "Add-on not found");
    await this.menuRepository.deleteAddOn(id);
  }

  async createAvailability(dto: CreateAvailabilityDto) {
    await this.getItem(dto.menuItemId);
    const customTimeFields =
      dto.type === MenuAvailabilityType.CUSTOM_TIME ? { startTime: dto.startTime, endTime: dto.endTime } : {};
    return this.menuRepository.createAvailability({ menuItemId: dto.menuItemId, type: dto.type, ...customTimeFields });
  }

  listAvailability(menuItemId: string) {
    return this.menuRepository.listAvailability(menuItemId);
  }

  async deleteAvailability(id: string) {
    await this.menuRepository.deleteAvailability(id);
  }

  private async getCategory(id: string) {
    return this.ensureExists(await this.menuRepository.findCategoryById(id), "Category not found");
  }

  private async getItem(id: string) {
    const item = this.ensureExists(await this.menuRepository.findItemById(id), "Menu item not found");
    if (item.deletedAt) {
      throw new ApiError(404, "Menu item not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return item;
  }

  private async ensureCategoryNameAvailable(restaurantId: string, name: string) {
    if (await this.menuRepository.findCategoryByName(restaurantId, name)) {
      throw new ApiError(409, "Category name already exists", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }

  private async ensureItemNameAvailable(categoryId: string, name: string) {
    if (await this.menuRepository.findItemByName(categoryId, name)) {
      throw new ApiError(409, "Menu item name already exists in this category", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }

  private async ensureVariantNameAvailable(menuItemId: string, name: string) {
    if (await this.menuRepository.findVariantByName(menuItemId, name)) {
      throw new ApiError(409, "Variant name already exists for this item", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }

  private async ensureAddOnNameAvailable(menuItemId: string, name: string) {
    if (await this.menuRepository.findAddOnByName(menuItemId, name)) {
      throw new ApiError(409, "Add-on name already exists for this item", ERROR_CODES.RESOURCE_CONFLICT);
    }
  }
}

export const menuService = new MenuService(new MenuRepository());
