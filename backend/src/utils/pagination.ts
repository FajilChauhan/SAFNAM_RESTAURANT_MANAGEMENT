// Normalizes pagination options and metadata for every list endpoint.
import type { PaginationMeta, PaginationOptions, SortOrder } from "../types/pagination.types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const normalizePage = (page?: unknown) => {
  const parsedPage = Number(page);
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
};

export const normalizeLimit = (limit?: unknown) => {
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsedLimit, MAX_LIMIT);
};

export const normalizeSortOrder = (order?: unknown): SortOrder => {
  return String(order).toLowerCase() === "asc" ? "asc" : "desc";
};

export const createPaginationOptions = (input: {
  page?: unknown;
  limit?: unknown;
  sort?: unknown;
  order?: unknown;
  search?: unknown;
}): PaginationOptions => {
  const page = normalizePage(input.page);
  const limit = normalizeLimit(input.limit);
  const sort = typeof input.sort === "string" && input.sort.trim() ? input.sort.trim() : undefined;
  const search =
    typeof input.search === "string" && input.search.trim() ? input.search.trim() : undefined;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort,
    order: normalizeSortOrder(input.order),
    search,
  };
};

export const createPaginationMeta = (
  total: number,
  options: Pick<PaginationOptions, "page" | "limit">,
): PaginationMeta => {
  const totalPages = Math.ceil(total / options.limit);

  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPreviousPage: options.page > 1,
  };
};
