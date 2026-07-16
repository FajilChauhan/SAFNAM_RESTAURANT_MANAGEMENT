import type { TableShape, TableStatus } from "@prisma/client";

export type CreateTableDto = {
  floorId: string;
  tableNumber: string;
  capacity: number;
  shape: TableShape;
  status?: TableStatus;
  qrCodeUrl?: string;
};

export type UpdateTableDto = Partial<CreateTableDto>;
