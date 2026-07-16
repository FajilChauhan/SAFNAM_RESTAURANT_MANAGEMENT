// Converts Express query objects into normalized reusable repository options.
import type { ParsedQs } from "qs";
import { createPaginationOptions } from "./pagination.js";
import type { QueryOptions } from "../types/pagination.types.js";

const RESERVED_QUERY_KEYS = new Set(["page", "limit", "sort", "order", "search"]);

const parseFilterValue = (value: string): string | number | boolean | Date => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && value.trim() !== "") {
    return numericValue;
  }

  const dateValue = new Date(value);

  if (!Number.isNaN(dateValue.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return dateValue;
  }

  return value;
};

const getSingleQueryValue = (value: string | ParsedQs | (string | ParsedQs)[] | undefined) => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

export const parseApiQuery = (
  query: ParsedQs,
  allowedFilterFields: string[] = [],
): QueryOptions => {
  const pagination = createPaginationOptions({
    page: getSingleQueryValue(query.page),
    limit: getSingleQueryValue(query.limit),
    sort: getSingleQueryValue(query.sort),
    order: getSingleQueryValue(query.order),
    search: getSingleQueryValue(query.search),
  });

  const filters = Object.entries(query).reduce<QueryOptions["filters"]>((parsedFilters, [key, value]) => {
    const singleValue = getSingleQueryValue(value);

    if (!RESERVED_QUERY_KEYS.has(key) && singleValue !== undefined && allowedFilterFields.includes(key)) {
      parsedFilters[key] = parseFilterValue(singleValue);
    }

    return parsedFilters;
  }, {});

  return {
    ...pagination,
    filters,
  };
};
