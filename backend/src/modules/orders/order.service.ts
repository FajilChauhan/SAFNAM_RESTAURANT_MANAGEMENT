import {
  BookingStatus,
  BookingType,
  CartStatus,
  MenuEntityStatus,
  OrderStatus,
  Prisma,
  TableStatus,
} from "@prisma/client";
import { BaseService } from "../../lib/BaseService.js";
import type { QueryOptions } from "../../types/pagination.types.js";
import type { AuthenticatedUser } from "../../types/request.types.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  AddCartItemDto,
  ConfirmOrderDto,
  UpdateCartItemNotesDto,
  UpdateCartItemQuantityDto,
  UpdateOrderStatusDto,
} from "./dto/order.dto.js";
import { OrderRepository } from "./order.repository.js";
import type { BillReadyOrder } from "./types/order.types.js";

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED"],
  SERVED: [],
  CANCELLED: [],
};

export class OrderService extends BaseService {
  constructor(private readonly orderRepository: OrderRepository) {
    super();
  }

  async getActiveCart(bookingId: string, actor: AuthenticatedUser) {
    await this.validateBookingCanOrder(bookingId);
    return this.getOrCreateActiveCart(bookingId, actor.id);
  }

  async addItem(dto: AddCartItemDto, actor: AuthenticatedUser) {
    await this.validateBookingCanOrder(dto.bookingId);
    const menuItem = await this.validateMenuItem(dto.menuItemId);
    const variant = dto.variantId ? this.validateVariant(menuItem.variants, dto.variantId) : undefined;
    const addOns = this.validateAddOns(menuItem.addOns, dto.addOnIds ?? []);
    const cart = await this.getOrCreateActiveCart(dto.bookingId, actor.id);
    const unitPrice = menuItem.price;
    const variantPrice = variant?.priceDifference ?? new Prisma.Decimal(0);
    const addOnsTotal = addOns.reduce((total, addOn) => total.plus(addOn.additionalPrice), new Prisma.Decimal(0));
    const lineTotal = unitPrice.plus(variantPrice).plus(addOnsTotal).mul(dto.quantity);

    return this.orderRepository.createCartItem({
      cartId: cart.id,
      menuItemId: menuItem.id,
      variantId: variant?.id,
      addOnIds: addOns.map((addOn) => addOn.id),
      quantity: dto.quantity,
      unitPriceSnapshot: unitPrice,
      variantPriceSnapshot: variantPrice,
      discountSnapshot: new Prisma.Decimal(0),
      lineTotalSnapshot: lineTotal,
      specialNotes: dto.specialNotes,
      orderedById: actor.id,
    });
  }

  async updateQuantity(cartItemId: string, dto: UpdateCartItemQuantityDto, actor: AuthenticatedUser) {
    const cartItem = this.ensureExists(await this.orderRepository.findCartItemById(cartItemId), "Cart item not found");
    this.ensureCartIsActive(cartItem.cart.status);
    const addOnsTotal = cartItem.addOns.reduce((total, addOn) => total.plus(addOn.priceSnapshot), new Prisma.Decimal(0));
    const lineTotal = cartItem.unitPriceSnapshot
      .plus(cartItem.variantPriceSnapshot)
      .plus(addOnsTotal)
      .mul(dto.quantity)
      .minus(cartItem.discountSnapshot);

    return this.orderRepository.updateCartItem(cartItemId, {
      quantity: dto.quantity,
      lineTotalSnapshot: lineTotal,
      updatedBy: actor.id,
    });
  }

  async updateNotes(cartItemId: string, dto: UpdateCartItemNotesDto, actor: AuthenticatedUser) {
    const cartItem = this.ensureExists(await this.orderRepository.findCartItemById(cartItemId), "Cart item not found");
    this.ensureCartIsActive(cartItem.cart.status);

    return this.orderRepository.updateCartItem(cartItemId, {
      specialNotes: dto.specialNotes,
      updatedBy: actor.id,
    });
  }

  async removeItem(cartItemId: string, actor: AuthenticatedUser) {
    const cartItem = this.ensureExists(await this.orderRepository.findCartItemById(cartItemId), "Cart item not found");
    this.ensureCartIsActive(cartItem.cart.status);
    await this.orderRepository.removeCartItem(cartItemId, actor.id);
  }

  async clearCart(bookingId: string, actor: AuthenticatedUser) {
    const cart = await this.getOrCreateActiveCart(bookingId, actor.id);
    await this.orderRepository.clearCart(cart.id, actor.id);
  }

  async confirmOrder(dto: ConfirmOrderDto, actor: AuthenticatedUser) {
    await this.validateBookingCanOrder(dto.bookingId);
    const cart = await this.getOrCreateActiveCart(dto.bookingId, actor.id);

    if (cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const subtotal = cart.items.reduce((total, item) => total.plus(item.lineTotalSnapshot), new Prisma.Decimal(0));
    const discount = cart.items.reduce((total, item) => total.plus(item.discountSnapshot), new Prisma.Decimal(0));
    const total = subtotal.minus(discount);

    return this.orderRepository.confirmCart({
      cartId: cart.id,
      orderNumber: await this.generateOrderNumber(),
      bookingId: dto.bookingId,
      orderedById: actor.id,
      source: dto.source,
      subtotalSnapshot: subtotal,
      discountSnapshot: discount,
      totalSnapshot: total,
      items: cart.items.map((item) => ({
        cartItem: item,
        itemNameSnapshot: item.menuItem.name,
        variantNameSnapshot: item.variant?.name,
        addOns: item.addOns.map((addOn) => ({
          addOnId: addOn.addOnId,
          nameSnapshot: addOn.addOn.name,
          priceSnapshot: addOn.priceSnapshot,
        })),
      })),
    });
  }

  listOrders(options: QueryOptions) {
    return this.orderRepository.listOrders(options);
  }

  async getOrderDetails(orderId: string) {
    const order = this.ensureExists(await this.orderRepository.findOrderById(orderId), "Order not found");
    return {
      order,
      billReady: this.toBillReadyOrder(order),
    };
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, actor: AuthenticatedUser) {
    const order = this.ensureExists(await this.orderRepository.findOrderById(orderId), "Order not found");
    const allowedStatuses = ORDER_STATUS_TRANSITIONS[order.status];

    if (!allowedStatuses.includes(dto.status)) {
      throw new ApiError(400, `Cannot move order from ${order.status} to ${dto.status}`);
    }

    return this.orderRepository.updateOrderStatus(orderId, dto.status, actor.id);
  }

  getKitchenQueue() {
    return this.orderRepository.listKitchenQueue();
  }

  private async validateBookingCanOrder(bookingId: string) {
    const booking = this.ensureExists(await this.orderRepository.findBookingForOrdering(bookingId), "Booking not found");

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new ApiError(400, "Only checked-in bookings can place orders");
    }

    if (booking.bookingType === BookingType.TABLE && booking.table?.status !== TableStatus.OCCUPIED) {
      throw new ApiError(400, "Only occupied tables can place orders");
    }

    return booking;
  }

  private async getOrCreateActiveCart(bookingId: string, actorId: string) {
    const activeCart = await this.orderRepository.findActiveCartByBookingId(bookingId);
    return activeCart ?? this.orderRepository.createCart(bookingId, actorId);
  }

  private ensureCartIsActive(status: CartStatus) {
    if (status !== CartStatus.ACTIVE) {
      throw new ApiError(400, "Cart is not active");
    }
  }

  private async validateMenuItem(menuItemId: string) {
    const menuItem = this.ensureExists(await this.orderRepository.findMenuItemForOrder(menuItemId), "Menu item not found");

    if (menuItem.deletedAt || menuItem.status !== MenuEntityStatus.ACTIVE || !menuItem.isAvailable) {
      throw new ApiError(400, "Menu item is not available");
    }

    if (menuItem.category.status !== MenuEntityStatus.ACTIVE || menuItem.category.deletedAt) {
      throw new ApiError(400, "Menu item category is inactive");
    }

    return menuItem;
  }

  private validateVariant<TVariant extends { id: string; status: MenuEntityStatus; deletedAt: Date | null }>(
    variants: TVariant[],
    variantId: string,
  ) {
    const variant = variants.find((itemVariant) => itemVariant.id === variantId);

    if (!variant || variant.status !== MenuEntityStatus.ACTIVE || variant.deletedAt) {
      throw new ApiError(400, "Selected variant is not available");
    }

    return variant;
  }

  private validateAddOns<TAddOn extends { id: string; status: MenuEntityStatus; deletedAt: Date | null }>(
    addOns: TAddOn[],
    addOnIds: string[],
  ) {
    return addOnIds.map((addOnId) => {
      const addOn = addOns.find((itemAddOn) => itemAddOn.id === addOnId);

      if (!addOn || addOn.status !== MenuEntityStatus.ACTIVE || addOn.deletedAt) {
        throw new ApiError(400, "Selected add-on is not available");
      }

      return addOn;
    });
  }

  private async generateOrderNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = `ORD-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;
      const existingOrder = await this.orderRepository.findOrderByNumber(orderNumber);

      if (!existingOrder) {
        return orderNumber;
      }
    }

    throw new ApiError(500, "Could not generate order number");
  }

  private toBillReadyOrder(order: NonNullable<Awaited<ReturnType<OrderRepository["findOrderById"]>>>): BillReadyOrder {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotalSnapshot.toString(),
      discount: order.discountSnapshot.toString(),
      total: order.totalSnapshot.toString(),
      lines: order.items.map((item) => ({
        itemName: item.itemNameSnapshot,
        variantName: item.variantNameSnapshot ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPriceSnapshot.toString(),
        addOnsTotal: item.addOns.reduce((total, addOn) => total.plus(addOn.priceSnapshot), new Prisma.Decimal(0)).toString(),
        discount: item.discountSnapshot.toString(),
        lineTotal: item.lineTotalSnapshot.toString(),
      })),
    };
  }
}

export const orderService = new OrderService(new OrderRepository());
