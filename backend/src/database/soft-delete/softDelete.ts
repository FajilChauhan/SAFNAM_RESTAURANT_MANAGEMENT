export type SoftDeleteWhere = {
  deletedAt?: null | Date | { not: null };
};

export const onlyActive = <TWhere extends object>(where?: TWhere): TWhere & { deletedAt: null } => ({
  ...(where ?? {}),
  deletedAt: null,
} as TWhere & { deletedAt: null });

export const softDeleteData = (actorId?: string) => ({
  deletedAt: new Date(),
  updatedBy: actorId,
});
