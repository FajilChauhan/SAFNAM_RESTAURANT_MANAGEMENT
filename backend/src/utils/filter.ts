// Converts allowed query filters into repository-safe where conditions.
type FilterValue = string | number | boolean | Date;

export const buildFilterWhere = (
  filters: Record<string, FilterValue>,
  allowedFields: string[],
) => {
  return Object.entries(filters).reduce<Record<string, FilterValue>>((where, [key, value]) => {
    if (allowedFields.includes(key)) {
      where[key] = value;
    }

    return where;
  }, {});
};
