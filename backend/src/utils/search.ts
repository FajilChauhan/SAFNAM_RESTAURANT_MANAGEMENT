// Builds reusable case-insensitive search conditions for repository queries.
type SearchCondition = Record<string, { contains: string; mode: "insensitive" }>;

export const buildSearchWhere = (search: string | undefined, fields: string[]) => {
  if (!search || fields.length === 0) {
    return {};
  }

  return {
    OR: fields.map<SearchCondition>((field) => ({
      [field]: {
        contains: search,
        mode: "insensitive",
      },
    })),
  };
};
