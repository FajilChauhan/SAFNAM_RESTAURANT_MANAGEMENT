// Operations response types describe cross-module dashboard data without owning business models.
export type DateRange = {
  start: Date;
  end: Date;
};

export type OperationsDashboardSummary = {
  todaysRevenue: string;
  todaysOrders: number;
  todaysBookings: number;
  todaysOccupancy: {
    occupiedTables: number;
    occupiedRooms: number;
    totalTables: number;
    totalRooms: number;
  };
  pendingBills: number;
  kitchenQueueCount: number;
};
