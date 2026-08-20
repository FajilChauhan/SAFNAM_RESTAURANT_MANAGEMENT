import type { CartItem, OrderStatus } from "@prisma/client";
import { CartStatus, DiscountType, InvoiceStatus, KitchenQueueStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import { ApiError } from "../../utils/ApiError.js";
import { buildFilterWhere } from "../../utils/filter.js";
import { createPaginationMeta } from "../../utils/pagination.js";
import { buildSearchWhere } from "../../utils/search.js";

const ORDER_FILTERS = ["bookingId", "status", "source", "orderedById"];

export class OrderRepository {
  findBookingForOrdering(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        table: true,
        room: true,
        invoice: true,
        appliedOffer: true,
      },
    });
  }

  findActiveCartByBookingId(bookingId: string) {
    return prisma.cart.findFirst({
      where: { bookingId, status: CartStatus.ACTIVE, deletedAt: null },
      include: this.cartInclude(),
    });
  }

  createCart(bookingId: string, actorId: string) {
    return prisma.cart.create({
      data: {
        bookingId,
        createdBy: actorId,
      },
      include: this.cartInclude(),
    });
  }

  findCartById(cartId: string) {
    return prisma.cart.findUnique({ where: { id: cartId }, include: this.cartInclude() });
  }

  findCartItemById(cartItemId: string) {
    return prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        addOns: true,
      },
    });
  }

  findMenuItemForOrder(menuItemId: string) {
    return prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: true,
        variants: true,
        addOns: true,
      },
    });
  }

  async createCartItem(input: {
    cartId: string;
    menuItemId: string;
    variantId?: string;
    addOnIds: string[];
    quantity: number;
    unitPriceSnapshot: Prisma.Decimal;
    variantPriceSnapshot: Prisma.Decimal;
    discountSnapshot: Prisma.Decimal;
    lineTotalSnapshot: Prisma.Decimal;
    specialNotes?: string;
    orderedById: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.create({
        data: {
          cartId: input.cartId,
          menuItemId: input.menuItemId,
          variantId: input.variantId,
          quantity: input.quantity,
          unitPriceSnapshot: input.unitPriceSnapshot,
          variantPriceSnapshot: input.variantPriceSnapshot,
          discountSnapshot: input.discountSnapshot,
          lineTotalSnapshot: input.lineTotalSnapshot,
          specialNotes: input.specialNotes,
          orderedById: input.orderedById,
          createdBy: input.orderedById,
        },
      });

      if (input.addOnIds.length > 0) {
        const addOns = await tx.menuItemAddOn.findMany({
          where: { id: { in: input.addOnIds }, deletedAt: null },
        });

        await tx.cartItemAddOn.createMany({
          data: addOns.map((addOn) => ({
            cartItemId: cartItem.id,
            addOnId: addOn.id,
            priceSnapshot: addOn.additionalPrice,
            createdBy: input.orderedById,
          })),
        });
      }

      return tx.cartItem.findUniqueOrThrow({
        where: { id: cartItem.id },
        include: {
          menuItem: true,
          variant: true,
          addOns: { include: { addOn: true } },
        },
      });
    });
  }

  updateCartItem(cartItemId: string, data: Prisma.CartItemUpdateInput) {
    return prisma.cartItem.update({ where: { id: cartItemId }, data });
  }

  removeCartItem(cartItemId: string, actorId: string) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { deletedAt: new Date(), updatedBy: actorId },
    });
  }

  clearCart(cartId: string, actorId: string) {
    return prisma.cartItem.updateMany({
      where: { cartId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: actorId },
    });
  }

  async confirmCart(input: {
    cartId: string;
    orderNumber: string;
    bookingId: string;
    orderedById: string;
    source: Prisma.OrderUncheckedCreateInput["source"];
    subtotalSnapshot: Prisma.Decimal;
    discountSnapshot: Prisma.Decimal;
    totalSnapshot: Prisma.Decimal;
    items: Array<{
      cartItem: CartItem;
      itemNameSnapshot: string;
      variantNameSnapshot?: string;
      addOns: Array<{ addOnId: string; nameSnapshot: string; priceSnapshot: Prisma.Decimal }>;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id: input.cartId },
        include: {
          booking: { include: { invoice: true, appliedOffer: true } },
          items: {
            where: { deletedAt: null },
            include: { menuItem: true },
          },
        },
      });

      if (!cart || cart.status !== CartStatus.ACTIVE || cart.bookingId !== input.bookingId) {
        throw new ApiError(409, "Cart is no longer active", ERROR_CODES.RESOURCE_CONFLICT);
      }

      for (const item of cart.items) {
        const decrement = await tx.menuItem.updateMany({
          where: {
            id: item.menuItemId,
            deletedAt: null,
            isAvailable: true,
            availableQuantity: { gte: item.quantity },
          },
          data: {
            availableQuantity: { decrement: item.quantity },
            soldQuantity: { increment: item.quantity },
          },
        });

        if (decrement.count !== 1) {
          throw new ApiError(
            409,
            `${item.menuItem.name} is no longer available in the requested quantity`,
            ERROR_CODES.RESOURCE_CONFLICT,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber: input.orderNumber,
          bookingId: input.bookingId,
          cartId: input.cartId,
          orderedById: input.orderedById,
          source: input.source,
          subtotalSnapshot: input.subtotalSnapshot,
          discountSnapshot: input.discountSnapshot,
          totalSnapshot: input.totalSnapshot,
          createdBy: input.orderedById,
          items: {
            create: input.items.map(({ cartItem, itemNameSnapshot, variantNameSnapshot, addOns }) => ({
              menuItemId: cartItem.menuItemId,
              variantId: cartItem.variantId,
              itemNameSnapshot,
              variantNameSnapshot,
              quantity: cartItem.quantity,
              unitPriceSnapshot: cartItem.unitPriceSnapshot,
              variantPriceSnapshot: cartItem.variantPriceSnapshot,
              discountSnapshot: cartItem.discountSnapshot,
              lineTotalSnapshot: cartItem.lineTotalSnapshot,
              specialNotes: cartItem.specialNotes,
              orderedById: cartItem.orderedById,
              createdBy: input.orderedById,
              addOns: {
                create: addOns.map((addOn) => ({
                  addOnId: addOn.addOnId,
                  nameSnapshot: addOn.nameSnapshot,
                  priceSnapshot: addOn.priceSnapshot,
                  createdBy: input.orderedById,
                })),
              },
            })),
          },
        },
        include: this.orderInclude(),
      });

      await tx.kitchenQueue.create({
        data: {
          orderId: order.id,
          status: KitchenQueueStatus.PENDING,
          createdBy: input.orderedById,
        },
      });

      await tx.cart.update({
        where: { id: input.cartId },
        data: { status: CartStatus.CONFIRMED, updatedBy: input.orderedById },
      });

      if (cart.booking.invoice) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: cart.booking.invoice.id,
            orderId: order.id,
            type: "FOOD",
            description: `Food order ${order.orderNumber}`,
            quantity: 1,
            unitPrice: input.totalSnapshot,
            totalAmount: input.totalSnapshot,
            isManualCharge: false,
            createdBy: input.orderedById,
          },
        });
        await this.recalculateInvoiceTotals(tx, cart.booking.invoice.id, input.orderedById);
      }

      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: this.orderInclude() });
    });
  }

  private async recalculateInvoiceTotals(tx: Prisma.TransactionClient, invoiceId: string, actorId: string) {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: {
        booking: { include: { appliedOffer: true } },
        items: { where: { deletedAt: null } },
      },
    });

    const lockedStatuses: InvoiceStatus[] = [InvoiceStatus.PAID, InvoiceStatus.LOCKED, InvoiceStatus.CANCELLED];
    if (lockedStatuses.includes(invoice.status)) {
      throw new ApiError(400, "Invoice cannot be modified after payment or cancellation");
    }

    const foodTotal = this.sumInvoiceItems(invoice.items.filter((item) => item.type === "FOOD"));
    const roomTotal = this.sumInvoiceItems(invoice.items.filter((item) => item.type === "ROOM"));
    const extraCharges = this.sumInvoiceItems(invoice.items.filter((item) => !["FOOD", "ROOM"].includes(item.type)));
    const subTotal = foodTotal.plus(roomTotal).plus(extraCharges);
    const discountType =
      invoice.booking.discountSource === "OFFER"
        ? invoice.booking.appliedOffer?.discountType
        : invoice.booking.discountSource === "GAME"
          ? DiscountType.PERCENTAGE
          : null;
    const discountValue = invoice.booking.discountPercentage;
    const discountTotal = discountType === DiscountType.PERCENTAGE ? subTotal.mul(discountValue).div(100) : invoice.booking.discountAmount;
    const taxableAmount = Prisma.Decimal.max(subTotal.minus(discountTotal), new Prisma.Decimal(0));
    const cgstAmount = taxableAmount.mul(invoice.cgstRate).div(100);
    const sgstAmount = taxableAmount.mul(invoice.sgstRate).div(100);
    const igstAmount = taxableAmount.mul(invoice.igstRate).div(100);
    const taxTotal = cgstAmount.plus(sgstAmount).plus(igstAmount);
    const grandTotal = taxableAmount.plus(taxTotal);

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        foodTotal,
        roomTotal,
        extraCharges,
        discountSource: invoice.booking.discountSource,
        discountType,
        discountValue,
        discountTotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxTotal,
        grandTotal,
        balanceAmount: grandTotal.minus(invoice.paidAmount),
        status: invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.GENERATED : invoice.status,
        updatedBy: actorId,
      },
    });
  }

  private sumInvoiceItems(items: Array<{ totalAmount: Prisma.Decimal }>) {
    return items.reduce((total, item) => total.plus(item.totalAmount), new Prisma.Decimal(0));
  }

  findOrderById(orderId: string) {
    return prisma.order.findUnique({ where: { id: orderId }, include: this.orderInclude() });
  }

  findOrderByNumber(orderNumber: string) {
    return prisma.order.findUnique({ where: { orderNumber } });
  }

  async listOrders(options: QueryOptions) {
    const where = {
      deletedAt: null,
      ...buildFilterWhere(options.filters, ORDER_FILTERS),
      ...buildSearchWhere(options.search, ["orderNumber"]),
    } satisfies Prisma.OrderWhereInput;
    const orderBy = options.sort
      ? ({ [options.sort]: options.order } as Prisma.OrderOrderByWithRelationInput)
      : ({ confirmedAt: "desc" } satisfies Prisma.OrderOrderByWithRelationInput);
    const [data, total] = await Promise.all([
      prisma.order.findMany({ where, skip: options.skip, take: options.limit, orderBy, include: this.orderInclude() }),
      prisma.order.count({ where }),
    ]);
    return { data, meta: createPaginationMeta(total, options) };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status, updatedBy: actorId },
        include: this.orderInclude(),
      });

      await tx.kitchenQueue.update({
        where: { orderId },
        data: {
          status: this.mapOrderStatusToKitchenStatus(status),
          startedAt: status === "PREPARING" ? new Date() : undefined,
          readyAt: status === "READY" ? new Date() : undefined,
          servedAt: status === "SERVED" ? new Date() : undefined,
          updatedBy: actorId,
        },
      });

      return order;
    });
  }

  listKitchenQueue() {
    return prisma.kitchenQueue.findMany({
      where: { deletedAt: null, status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] } },
      include: { order: { include: this.orderInclude() } },
      orderBy: { queuedAt: "asc" },
    });
  }

  private mapOrderStatusToKitchenStatus(status: OrderStatus) {
    if (status === "PREPARING") return KitchenQueueStatus.PREPARING;
    if (status === "READY") return KitchenQueueStatus.READY;
    if (status === "SERVED") return KitchenQueueStatus.SERVED;
    if (status === "CANCELLED") return KitchenQueueStatus.CANCELLED;
    return KitchenQueueStatus.PENDING;
  }

  private cartInclude() {
    return {
      booking: { include: { table: true, room: true } },
      items: {
        where: { deletedAt: null },
        include: { menuItem: true, variant: true, addOns: { include: { addOn: true } } },
      },
    } satisfies Prisma.CartInclude;
  }

  private orderInclude() {
    return {
      booking: {
        include: {
          room: true,
          table: {
            include: {
              floor: true,
            },
          },
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          invoice: true,
        },
      },
      orderedBy: { select: { id: true, fullName: true, role: true } },
      items: {
        include: {
          addOns: {
            include: {
              addOn: true,
            },
          },
          menuItem: true,
        },
      },
      kitchenQueue: true,
    } satisfies Prisma.OrderInclude;
  }
}
