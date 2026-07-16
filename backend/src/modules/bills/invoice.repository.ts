import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export class InvoiceRepository {
  findBookingForInvoice(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
        orders: { where: { status: "SERVED", deletedAt: null }, include: { items: true } },
        invoice: { include: { items: { where: { deletedAt: null } } } },
      },
    });
  }

  findInvoiceByBookingId(bookingId: string) {
    return prisma.invoice.findUnique({
      where: { bookingId },
      include: { booking: true, items: { where: { deletedAt: null } } },
    });
  }

  findInvoiceById(invoiceId: string) {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { booking: true, items: { where: { deletedAt: null } } },
    });
  }

  findInvoiceByNumber(invoiceNumber: string) {
    return prisma.invoice.findUnique({ where: { invoiceNumber } });
  }

  createInvoice(data: Prisma.InvoiceUncheckedCreateInput, items: Prisma.InvoiceItemUncheckedCreateWithoutInvoiceInput[]) {
    return prisma.invoice.create({
      data: { ...data, items: { create: items } },
      include: { booking: true, items: { where: { deletedAt: null } } },
    });
  }

  updateInvoice(invoiceId: string, data: Prisma.InvoiceUncheckedUpdateInput) {
    return prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: { booking: true, items: { where: { deletedAt: null } } },
    });
  }

  addItem(invoiceId: string, data: Prisma.InvoiceItemUncheckedCreateInput) {
    return prisma.invoiceItem.create({ data: { ...data, invoiceId } });
  }

  findInvoiceItemById(itemId: string) {
    return prisma.invoiceItem.findUnique({
      where: { id: itemId },
      include: { invoice: { include: { items: { where: { deletedAt: null } } } } },
    });
  }

  softDeleteItem(itemId: string, actorId: string) {
    return prisma.invoiceItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date(), updatedBy: actorId },
    });
  }
}
