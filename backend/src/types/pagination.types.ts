export type SortOrder = "asc" | "desc";

export type PaginationOptions = {
  page: number;
  limit: number;
  skip: number;
  sort?: string;
  order: SortOrder;
  search?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type QueryOptions = PaginationOptions & {
  filters: Record<string, string | number | boolean | Date>;
};
