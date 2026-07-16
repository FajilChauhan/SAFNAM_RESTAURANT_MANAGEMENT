import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseApiQuery } from "../../utils/queryParser.js";
import { uuidSchema } from "../../utils/validator.js";
import { orderService } from "./order.service.js";
import {
  addCartItemSchema,
  bookingParamSchema,
  confirmOrderSchema,
  updateCartItemNotesSchema,
  updateCartItemQuantitySchema,
  updateOrderStatusSchema,
} from "./validators/order.validator.js";

class OrderController extends BaseController {
  getActiveCart = asyncHandler(async (req, res) => {
    const { bookingId } = bookingParamSchema.parse(req.params);
    const cart = await orderService.getActiveCart(bookingId, req.user!);

    this.ok(res, "Active cart fetched successfully", { cart });
  });

  addItem = asyncHandler(async (req, res) => {
    const cartItem = await orderService.addItem(addCartItemSchema.parse(req.body), req.user!);

    this.created(res, "Item added to cart successfully", { cartItem });
  });

  updateQuantity = asyncHandler(async (req, res) => {
    const cartItem = await orderService.updateQuantity(
      uuidSchema.parse(req.params.cartItemId),
      updateCartItemQuantitySchema.parse(req.body),
      req.user!,
    );

    this.ok(res, "Cart item quantity updated successfully", { cartItem });
  });

  updateNotes = asyncHandler(async (req, res) => {
    const cartItem = await orderService.updateNotes(
      uuidSchema.parse(req.params.cartItemId),
      updateCartItemNotesSchema.parse(req.body),
      req.user!,
    );

    this.ok(res, "Cart item notes updated successfully", { cartItem });
  });

  removeItem = asyncHandler(async (req, res) => {
    await orderService.removeItem(uuidSchema.parse(req.params.cartItemId), req.user!);

    this.ok(res, "Item removed from cart successfully");
  });

  clearCart = asyncHandler(async (req, res) => {
    const { bookingId } = bookingParamSchema.parse(req.params);
    await orderService.clearCart(bookingId, req.user!);

    this.ok(res, "Cart cleared successfully");
  });

  confirmOrder = asyncHandler(async (req, res) => {
    const order = await orderService.confirmOrder(confirmOrderSchema.parse(req.body), req.user!);

    this.created(res, "Order confirmed and sent to kitchen successfully", { order });
  });

  listOrders = asyncHandler(async (req, res) => {
    const result = await orderService.listOrders(parseApiQuery(req.query, ["bookingId", "status", "source", "orderedById"]));

    this.ok(res, "Orders fetched successfully", { orders: result.data }, result.meta);
  });

  getOrderDetails = asyncHandler(async (req, res) => {
    const result = await orderService.getOrderDetails(uuidSchema.parse(req.params.orderId));

    this.ok(res, "Order details fetched successfully", result);
  });

  updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(
      uuidSchema.parse(req.params.orderId),
      updateOrderStatusSchema.parse(req.body),
      req.user!,
    );

    this.ok(res, "Order status updated successfully", { order });
  });

  kitchenQueue = asyncHandler(async (_req, res) => {
    const queue = await orderService.getKitchenQueue();

    this.ok(res, "Kitchen queue fetched successfully", { queue });
  });
}

export const orderController = new OrderController();
