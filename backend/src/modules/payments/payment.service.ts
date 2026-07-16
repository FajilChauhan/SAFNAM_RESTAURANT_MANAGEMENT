import { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { BaseService } from "../../lib/BaseService.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreatePaymentDto, RefundPaymentDto } from "./dto/payment.dto.js";
import { PaymentRepository } from "./payment.repository.js";
import type { InvoicePaymentSummary, PaymentReceipt } from "./types/payment.types.js";

export class PaymentService extends BaseService {
  constructor(private readonly paymentRepository: PaymentRepository) {
    super();
  }

  async create(dto: CreatePaymentDto, actor: AuthenticatedUser) {
    const invoice = this.ensureExists(await this.paymentRepository.findInvoiceById(dto.invoiceId), "Invoice not found");
    if (invoice.status === InvoiceStatus.CANCELLED) throw new ApiError(400, "Cannot pay cancelled invoice");
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.gt(invoice.balanceAmount)) throw new ApiError(400, "Payment amount cannot exceed invoice balance");
    const paidAmount = invoice.paidAmount.plus(amount);
    const balanceAmount = invoice.grandTotal.minus(paidAmount);
    const status = balanceAmount.lte(0) ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    return this.paymentRepository.createPayment({
      paymentNumber: await this.generatePaymentNumber(),
      invoiceId: invoice.id,
      bookingId: invoice.bookingId,
      method: dto.method,
      amount,
      transactionId: dto.transactionId,
      referenceNumber: dto.referenceNumber,
      receivedById: actor.id,
      remarks: dto.remarks,
      invoicePaidAmount: paidAmount,
      invoiceBalanceAmount: balanceAmount,
      invoiceStatus: status,
    });
  }

  async get(paymentId: string) {
    const payment = this.ensureExists(await this.paymentRepository.findPaymentById(paymentId), "Payment not found");
    return { payment, receipt: this.toReceipt(payment) };
  }

  history(invoiceId: string) {
    return this.paymentRepository.history(invoiceId);
  }

  async refund(paymentId: string, dto: RefundPaymentDto, actor: AuthenticatedUser) {
    const payment = this.ensureExists(await this.paymentRepository.findPaymentById(paymentId), "Payment not found");
    if (payment.status !== PaymentStatus.SUCCESS && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new ApiError(400, "Only successful payments can be refunded");
    }
    const amount = new Prisma.Decimal(dto.amount);
    const refundable = payment.amount.minus(payment.refundedAmount);
    if (amount.gt(refundable)) throw new ApiError(400, "Refund amount exceeds refundable balance");
    const refundedAmount = payment.refundedAmount.plus(amount);
    const paymentStatus = refundedAmount.eq(payment.amount) ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    const invoicePaidAmount = payment.invoice.paidAmount.minus(amount);
    const invoiceBalanceAmount = payment.invoice.grandTotal.minus(invoicePaidAmount);
    const invoiceStatus = invoicePaidAmount.lte(0)
      ? InvoiceStatus.GENERATED
      : invoiceBalanceAmount.lte(0)
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIALLY_PAID;

    return this.paymentRepository.refund({
      paymentId,
      refundNumber: await this.generateRefundNumber(),
      amount,
      reason: dto.reason,
      actorId: actor.id,
      paymentStatus,
      paymentRefundedAmount: refundedAmount,
      invoicePaidAmount,
      invoiceBalanceAmount,
      invoiceStatus,
      invoiceId: payment.invoiceId,
    });
  }

  async summary(invoiceId: string): Promise<InvoicePaymentSummary> {
    const invoice = this.ensureExists(await this.paymentRepository.findInvoiceById(invoiceId), "Invoice not found");
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal.toString(),
      paidAmount: invoice.paidAmount.toString(),
      balanceAmount: invoice.balanceAmount.toString(),
      status: invoice.status,
    };
  }

  private toReceipt(payment: NonNullable<Awaited<ReturnType<PaymentRepository["findPaymentById"]>>>): PaymentReceipt {
    return {
      paymentNumber: payment.paymentNumber,
      invoiceNumber: payment.invoice.invoiceNumber,
      bookingId: payment.bookingId,
      method: payment.method,
      amount: payment.amount.toString(),
      paidAt: payment.paidAt,
      receivedBy: payment.receivedBy.fullName,
    };
  }

  private async generatePaymentNumber() {
    return this.generateNumber("PAY", (number) => this.paymentRepository.findPaymentByNumber(number));
  }

  private async generateRefundNumber() {
    return this.generateNumber("REF", (number) => this.paymentRepository.findRefundByNumber(number));
  }

  private async generateNumber(prefix: string, exists: (number: string) => Promise<unknown>) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const number = `${prefix}-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!(await exists(number))) return number;
    }
    throw new ApiError(500, `Could not generate ${prefix} number`);
  }
}

export const paymentService = new PaymentService(new PaymentRepository());
