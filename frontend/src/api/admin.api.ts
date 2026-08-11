import api from "./axios";

export type UserRole = "CUSTOMER" | "RECEPTION" | "KITCHEN" | "MANAGER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type EntityStatus = "ACTIVE" | "INACTIVE";

export type AdminEmployee = {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  role: Exclude<UserRole, "CUSTOMER">;
  status: UserStatus;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCustomer = {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  status: UserStatus;
  avatarUrl?: string | null;
  visitCount: number;
  totalSpending: string | number;
  lastVisitAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOffer = {
  id: string;
  title: string;
  description?: string | null;
  code?: string | null;
  type: "TODAY" | "COUPON" | "BIRTHDAY" | "FESTIVAL";
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string | number;
  minSpend: string | number;
  maxDiscount?: string | number | null;
  imageUrl?: string | null;
  startsAt: string;
  endsAt: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: string;
  type?: string;
};

export type ApiEnvelope<T> = {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export const adminApi = {
  employees: {
    list: (params?: PaginatedParams) => api.get<ApiEnvelope<{ employees: AdminEmployee[] }>>("/api/admin/employees", { params }),
    create: (data: {
      fullName: string;
      email?: string;
      phoneNumber: string;
      password: string;
      role: Exclude<UserRole, "CUSTOMER">;
      status: UserStatus;
    }) => api.post<ApiEnvelope<{ employee: AdminEmployee }>>("/api/admin/employees", data),
    update: (id: string, data: Partial<AdminEmployee> & { password?: string }) =>
      api.patch<ApiEnvelope<{ employee: AdminEmployee }>>(`/api/admin/employees/${id}`, data),
    status: (id: string, status: UserStatus) => api.patch<ApiEnvelope<{ employee: AdminEmployee }>>(`/api/admin/employees/${id}/status`, { status }),
    remove: (id: string) => api.delete<ApiEnvelope<{ employee: AdminEmployee }>>(`/api/admin/employees/${id}`),
  },
  customers: {
    list: (params?: PaginatedParams) => api.get<ApiEnvelope<{ customers: AdminCustomer[] }>>("/api/admin/customers", { params }),
    get: (id: string) => api.get<ApiEnvelope<{ customer: AdminCustomer }>>(`/api/admin/customers/${id}`),
    status: (id: string, status: UserStatus) => api.patch<ApiEnvelope<{ customer: AdminCustomer }>>(`/api/admin/customers/${id}/status`, { status }),
  },
  offers: {
    list: (params?: PaginatedParams) => api.get<ApiEnvelope<{ offers: AdminOffer[] }>>("/api/admin/offers", { params }),
    create: (data: Omit<AdminOffer, "id" | "createdAt" | "updatedAt">) => api.post<ApiEnvelope<{ offer: AdminOffer }>>("/api/admin/offers", data),
    update: (id: string, data: Partial<AdminOffer>) => api.patch<ApiEnvelope<{ offer: AdminOffer }>>(`/api/admin/offers/${id}`, data),
    remove: (id: string) => api.delete<ApiEnvelope<{ offer: AdminOffer }>>(`/api/admin/offers/${id}`),
  },
  roles: () => api.get<ApiEnvelope<{ roles: Array<{ role: UserRole; assignableToEmployee: boolean; permissions: string[] }> }>>("/api/admin/roles"),
  permissions: () => api.get<ApiEnvelope<{ permissions: Array<{ permission: string }> }>>("/api/admin/permissions"),
  auditLogs: (params?: PaginatedParams) => api.get<ApiEnvelope<{ audit: { activities: Array<Record<string, string>>; note: string } }>>("/api/admin/audit-logs", { params }),
  health: () => api.get<ApiEnvelope<{ health: { system: Record<string, string | number>; database: Record<string, string | number> } }>>("/api/admin/health"),
};
