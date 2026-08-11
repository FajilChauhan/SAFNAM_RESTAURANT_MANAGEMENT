import { MenuEntityStatus, Prisma, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import type {
  AdminListQueryDto,
  CreateEmployeeDto,
  CreateOfferDto,
  OfferListQueryDto,
  UpdateEmployeeDto,
  UpdateOfferDto,
} from "./admin.validator.js";

const employeeSelect = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true,
  status: true,
  avatarUrl: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const customerSelect = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  status: true,
  avatarUrl: true,
  visitCount: true,
  totalSpending: true,
  lastVisitAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const offerSelect = {
  id: true,
  title: true,
  description: true,
  code: true,
  type: true,
  discountType: true,
  discountValue: true,
  minSpend: true,
  maxDiscount: true,
  imageUrl: true,
  startsAt: true,
  endsAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OfferSelect;

export class AdminRepository {
  async listEmployees(query: AdminListQueryDto) {
    const staffRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN];
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: query.role && query.role !== UserRole.CUSTOMER ? query.role : { in: staffRoles },
      status: query.status,
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phoneNumber: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return this.paginatedUsers(where, query, employeeSelect);
  }

  findUserById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null }, select: employeeSelect });
  }

  findUserByPhone(phoneNumber: string) {
    return prisma.user.findUnique({ where: { phoneNumber } });
  }

  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  createEmployee(data: Omit<CreateEmployeeDto, "password"> & { passwordHash: string; createdBy?: string }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        passwordHash: data.passwordHash,
        role: data.role,
        status: data.status,
        avatarUrl: data.avatarUrl,
        createdBy: data.createdBy,
      },
      select: employeeSelect,
    });
  }

  updateEmployee(id: string, data: Omit<UpdateEmployeeDto, "password"> & { passwordHash?: string; updatedBy?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: employeeSelect,
    });
  }

  softDeleteUser(id: string, updatedBy?: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.INACTIVE, updatedBy },
      select: employeeSelect,
    });
  }

  async listCustomers(query: AdminListQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: UserRole.CUSTOMER,
      status: query.status,
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phoneNumber: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return this.paginatedUsers(where, query, customerSelect);
  }

  getCustomer(id: string) {
    return prisma.user.findFirst({
      where: { id, role: UserRole.CUSTOMER, deletedAt: null },
      select: {
        ...customerSelect,
        bookings: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { table: true, room: true, invoice: true, payments: true, feedback: true },
        },
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: true },
        },
        payments: { where: { deletedAt: null }, orderBy: { paidAt: "desc" }, take: 10 },
        feedback: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }

  async listOffers(query: OfferListQueryDto) {
    const where: Prisma.OfferWhereInput = {
      deletedAt: null,
      type: query.type,
      status: query.status,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    const [total, offers] = await Promise.all([
      prisma.offer.count({ where }),
      prisma.offer.findMany({
        where,
        select: offerSelect,
        orderBy: [{ status: "asc" }, { startsAt: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { data: offers, meta: this.meta(query.page, query.limit, total) };
  }

  createOffer(data: CreateOfferDto & { createdBy?: string }) {
    return prisma.offer.create({
      data: this.createOfferData(data),
      select: offerSelect,
    });
  }

  updateOffer(id: string, data: UpdateOfferDto & { updatedBy?: string }) {
    return prisma.offer.update({
      where: { id },
      data: this.updateOfferData(data),
      select: offerSelect,
    });
  }

  softDeleteOffer(id: string, updatedBy?: string) {
    return prisma.offer.update({
      where: { id },
      data: { deletedAt: new Date(), status: MenuEntityStatus.INACTIVE, updatedBy },
      select: offerSelect,
    });
  }

  findOfferById(id: string) {
    return prisma.offer.findFirst({ where: { id, deletedAt: null }, select: offerSelect });
  }

  systemHealth() {
    const startedAt = new Date(Date.now() - process.uptime() * 1000);
    return {
      api: "OK",
      database: "OK",
      storage: "Not configured",
      serverUptimeSeconds: Math.floor(process.uptime()),
      startedAt,
      lastBackup: "Not configured",
      nodeEnv: process.env.NODE_ENV ?? "development",
    };
  }

  async databaseHealth() {
    const started = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: "OK", latencyMs: Date.now() - started };
  }

  async auditSummary(query: AdminListQueryDto) {
    const take = Math.min(query.limit, 50);
    const [users, bookings, orders, payments] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, fullName: true, role: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.booking.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, bookingNumber: true, status: true, updatedAt: true, createdAt: true, customer: { select: { fullName: true } } },
      }),
      prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, orderNumber: true, status: true, updatedAt: true, createdAt: true, orderedBy: { select: { fullName: true } } },
      }),
      prisma.payment.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, paymentNumber: true, status: true, updatedAt: true, createdAt: true, receivedBy: { select: { fullName: true, role: true } } },
      }),
    ]);

    const activities = [
      ...users.map((item) => ({
        id: `user-${item.id}`,
        module: "Users",
        action: item.createdAt.getTime() === item.updatedAt.getTime() ? "Created" : "Updated",
        actor: item.fullName,
        role: item.role,
        entity: item.status,
        timestamp: item.updatedAt,
      })),
      ...bookings.map((item) => ({
        id: `booking-${item.id}`,
        module: "Bookings",
        action: "Status changed",
        actor: item.customer.fullName,
        role: "CUSTOMER",
        entity: `${item.bookingNumber} · ${item.status}`,
        timestamp: item.updatedAt,
      })),
      ...orders.map((item) => ({
        id: `order-${item.id}`,
        module: "Orders",
        action: "Status changed",
        actor: item.orderedBy.fullName,
        role: "CUSTOMER",
        entity: `${item.orderNumber} · ${item.status}`,
        timestamp: item.updatedAt,
      })),
      ...payments.map((item) => ({
        id: `payment-${item.id}`,
        module: "Payments",
        action: "Recorded",
        actor: item.receivedBy.fullName,
        role: item.receivedBy.role,
        entity: `${item.paymentNumber} · ${item.status}`,
        timestamp: item.updatedAt,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, take);

    return { activities, note: "Derived from existing transactional updatedAt fields; no separate audit log table exists." };
  }

  private async paginatedUsers<T extends Prisma.UserSelect>(where: Prisma.UserWhereInput, query: AdminListQueryDto, select: T) {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { data: users, meta: this.meta(query.page, query.limit, total) };
  }

  private meta(page: number, limit: number, total: number) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }

  private createOfferData(data: CreateOfferDto & { createdBy?: string }): Prisma.OfferUncheckedCreateInput {
    return {
      ...data,
      discountValue: new Prisma.Decimal(data.discountValue),
      minSpend: new Prisma.Decimal(data.minSpend),
      maxDiscount: data.maxDiscount === undefined ? undefined : new Prisma.Decimal(data.maxDiscount),
    };
  }

  private updateOfferData(data: UpdateOfferDto & { updatedBy?: string }): Prisma.OfferUpdateInput {
    return {
      ...data,
      discountValue: data.discountValue === undefined ? undefined : new Prisma.Decimal(data.discountValue),
      minSpend: data.minSpend === undefined ? undefined : new Prisma.Decimal(data.minSpend),
      maxDiscount: data.maxDiscount === undefined ? undefined : new Prisma.Decimal(data.maxDiscount),
    };
  }
}
