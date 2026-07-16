import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { buildFilterWhere } from "../../utils/filter.js";
import { createPaginationMeta } from "../../utils/pagination.js";
import { buildSearchWhere } from "../../utils/search.js";

const CATEGORY_FILTERS = ["restaurantId", "status"];
const ITEM_FILTERS = ["categoryId", "status", "foodType", "spicyLevel", "isTodaySpecial", "isAvailable"];
const CHILD_FILTERS = ["menuItemId", "status"];

export class MenuRepository {
  createCategory(data: Prisma.MenuCategoryUncheckedCreateInput) {
    return prisma.menuCategory.create({ data });
  }

  findCategoryById(id: string) {
    return prisma.menuCategory.findUnique({ where: { id } });
  }

  findCategoryByName(restaurantId: string, name: string) {
    return prisma.menuCategory.findUnique({ where: { restaurantId_name: { restaurantId, name } } });
  }

  countItemsByCategory(categoryId: string) {
    return prisma.menuItem.count({ where: { categoryId, deletedAt: null } });
  }

  async listCategories(options: QueryOptions) {
    const where = {
      ...buildFilterWhere(options.filters, CATEGORY_FILTERS),
      ...buildSearchWhere(options.search, ["name", "description"]),
    } satisfies Prisma.MenuCategoryWhereInput;
    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.MenuCategoryOrderByWithRelationInput)
      : ({ displayOrder: "asc" } satisfies Prisma.MenuCategoryOrderByWithRelationInput);
    const [data, total] = await Promise.all([
      prisma.menuCategory.findMany({ where, skip: options.skip, take: options.limit, orderBy }),
      prisma.menuCategory.count({ where }),
    ]);
    return { data, meta: createPaginationMeta(total, options) };
  }

  updateCategory(id: string, data: Prisma.MenuCategoryUpdateInput) {
    return prisma.menuCategory.update({ where: { id }, data });
  }

  deleteCategory(id: string) {
    return prisma.menuCategory.delete({ where: { id } });
  }

  createItem(data: Prisma.MenuItemUncheckedCreateInput) {
    return prisma.menuItem.create({ data, include: this.itemInclude() });
  }

  findItemById(id: string) {
    return prisma.menuItem.findUnique({ where: { id }, include: this.itemInclude() });
  }

  findItemByName(categoryId: string, name: string) {
    return prisma.menuItem.findUnique({ where: { categoryId_name: { categoryId, name } } });
  }

  async listItems(options: QueryOptions) {
    const where = {
      deletedAt: null,
      ...buildFilterWhere(options.filters, ITEM_FILTERS),
      ...buildSearchWhere(options.search, ["name", "description"]),
    } satisfies Prisma.MenuItemWhereInput;
    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.MenuItemOrderByWithRelationInput)
      : ({ name: "asc" } satisfies Prisma.MenuItemOrderByWithRelationInput);
    const [data, total] = await Promise.all([
      prisma.menuItem.findMany({ where, skip: options.skip, take: options.limit, orderBy, include: this.itemInclude() }),
      prisma.menuItem.count({ where }),
    ]);
    return { data, meta: createPaginationMeta(total, options) };
  }

  updateItem(id: string, data: Prisma.MenuItemUncheckedUpdateInput) {
    return prisma.menuItem.update({ where: { id }, data, include: this.itemInclude() });
  }

  softDeleteItem(id: string) {
    return prisma.menuItem.update({ where: { id }, data: { deletedAt: new Date(), isAvailable: false } });
  }

  createVariant(data: Prisma.MenuItemVariantUncheckedCreateInput) {
    return prisma.menuItemVariant.create({ data });
  }

  findVariantById(id: string) {
    return prisma.menuItemVariant.findUnique({ where: { id } });
  }

  findVariantByName(menuItemId: string, name: string) {
    return prisma.menuItemVariant.findUnique({ where: { menuItemId_name: { menuItemId, name } } });
  }

  listVariants(options: QueryOptions) {
    const where = buildFilterWhere(options.filters, CHILD_FILTERS) satisfies Prisma.MenuItemVariantWhereInput;
    return prisma.menuItemVariant.findMany({ where, orderBy: { name: "asc" } });
  }

  updateVariant(id: string, data: Prisma.MenuItemVariantUpdateInput) {
    return prisma.menuItemVariant.update({ where: { id }, data });
  }

  deleteVariant(id: string) {
    return prisma.menuItemVariant.delete({ where: { id } });
  }

  createAddOn(data: Prisma.MenuItemAddOnUncheckedCreateInput) {
    return prisma.menuItemAddOn.create({ data });
  }

  findAddOnById(id: string) {
    return prisma.menuItemAddOn.findUnique({ where: { id } });
  }

  findAddOnByName(menuItemId: string, name: string) {
    return prisma.menuItemAddOn.findUnique({ where: { menuItemId_name: { menuItemId, name } } });
  }

  listAddOns(options: QueryOptions) {
    const where = buildFilterWhere(options.filters, CHILD_FILTERS) satisfies Prisma.MenuItemAddOnWhereInput;
    return prisma.menuItemAddOn.findMany({ where, orderBy: { name: "asc" } });
  }

  updateAddOn(id: string, data: Prisma.MenuItemAddOnUpdateInput) {
    return prisma.menuItemAddOn.update({ where: { id }, data });
  }

  deleteAddOn(id: string) {
    return prisma.menuItemAddOn.delete({ where: { id } });
  }

  createAvailability(data: Prisma.MenuAvailabilityUncheckedCreateInput) {
    return prisma.menuAvailability.create({ data });
  }

  listAvailability(menuItemId: string) {
    return prisma.menuAvailability.findMany({ where: { menuItemId }, orderBy: { createdAt: "asc" } });
  }

  deleteAvailability(id: string) {
    return prisma.menuAvailability.delete({ where: { id } });
  }

  private itemInclude() {
    return {
      category: true,
      variants: true,
      addOns: true,
      availability: true,
    } satisfies Prisma.MenuItemInclude;
  }
}
