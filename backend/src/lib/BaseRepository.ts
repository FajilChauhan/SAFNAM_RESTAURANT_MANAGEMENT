import type { PaginationMeta, PaginationOptions } from "../types/pagination.types.js";
import { createPaginationMeta } from "../utils/pagination.js";

type FindManyArgs<TWhere, TOrderBy> = {
  where?: TWhere;
  skip?: number;
  take?: number;
  orderBy?: TOrderBy;
};

type CountArgs<TWhere> = {
  where?: TWhere;
};

type PaginatedDelegate<TEntity, TWhere, TOrderBy> = {
  findMany(args: FindManyArgs<TWhere, TOrderBy>): Promise<TEntity[]>;
  count(args: CountArgs<TWhere>): Promise<number>;
};

export abstract class BaseRepository {
  protected createOrderBy<TOrderBy>(sort: string | undefined, order: "asc" | "desc") {
    return sort ? ({ [sort]: order } as TOrderBy) : undefined;
  }

  protected async paginate<TEntity, TWhere, TOrderBy>(
    delegate: PaginatedDelegate<TEntity, TWhere, TOrderBy>,
    options: PaginationOptions,
    where?: TWhere,
    orderBy?: TOrderBy,
  ): Promise<{ data: TEntity[]; meta: PaginationMeta }> {
    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        skip: options.skip,
        take: options.limit,
        orderBy,
      }),
      delegate.count({ where }),
    ]);

    return {
      data,
      meta: createPaginationMeta(total, options),
    };
  }
}
