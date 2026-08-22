import type { KitchenPriority, KitchenQueueStatus, OrderStatus } from "@prisma/client";
import { DiscountType, InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const ACTIVE_KITCHEN_STATUSES: KitchenQueueStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY"];

export class KitchenRepository {
  listQueue() {
    return prisma.kitchenQueue.findMany({
      where: {
        deletedAt: null,
        status: { in: ACTIVE_KITCHEN_STATUSES },
        order: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "SERVED"] },
        },
      },
      include: this.queueInclude(),
      orderBy: [{ priority: "desc" }, { queuedAt: "asc" }],
    });
  }

  findByOrderId(orderId: string) {
    return prisma.kitchenQueue.findUnique({
      where: { orderId },
      include: this.queueInclude(),
    });
  }

  updatePriority(orderId: string, priority: KitchenPriority, actorId: string) {
    return prisma.kitchenQueue.update({
      where: { orderId },
      data: { priority, updatedBy: actorId },
      include: this.queueInclude(),
    });
  }

  updateStatus(input: {
    orderId: string;
    queueStatus: KitchenQueueStatus;
    orderStatus: OrderStatus;
    actorId: string;
  }) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: input.orderId },
        data: { status: input.orderStatus, updatedBy: input.actorId },
        include: { booking: { include: { invoice: true } } },
      });

      const queueItem = await tx.kitchenQueue.update({
        where: { orderId: input.orderId },
        data: {
          status: input.queueStatus,
          acceptedAt: input.queueStatus === "ACCEPTED" ? now : undefined,
          startedAt: input.queueStatus === "PREPARING" ? now : undefined,
          readyAt: input.queueStatus === "READY" ? now : undefined,
          servedAt: input.queueStatus === "SERVED" ? now : undefined,
          cancelledAt: input.queueStatus === "CANCELLED" ? now : undefined,
          updatedBy: input.actorId,
        },
        include: this.queueInclude(),
      });

      if (input.queueStatus === "CANCELLED" && order.booking.invoice) {
        await tx.invoiceItem.updateMany({
          where: {
            orderId: order.id,
            invoiceId: order.booking.invoice.id,
            deletedAt: null,
          },
          data: {
            deletedAt: now,
            updatedBy: input.actorId,
          },
        });
        await this.recalculateInvoiceTotals(tx, order.booking.invoice.id, input.actorId);
      }

      return queueItem;
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
      throw new ApiError(400, "Paid, locked, or cancelled invoices cannot be changed by order cancellation");
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

  async summary() {
    const [pending, accepted, preparing, ready, highPriority, vip] = await Promise.all([
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "PENDING" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "ACCEPTED" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "PREPARING" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, status: "READY" } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, priority: "HIGH", status: { in: ACTIVE_KITCHEN_STATUSES } } }),
      prisma.kitchenQueue.count({ where: { deletedAt: null, priority: "VIP", status: { in: ACTIVE_KITCHEN_STATUSES } } }),
    ]);

    return { pending, accepted, preparing, ready, highPriority, vip };
  }

  private queueInclude() {
    return {
      order: {
        include: {
          booking: {
            include: {
              customer: { select: { id: true, fullName: true, phoneNumber: true } },
              table: true,
              room: true,
            },
          },
          items: { include: { addOns: true } },
        },
      },
    };
  }
}
