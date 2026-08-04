// Customer controller exposes the customer experience platform over HTTP.
import { BaseController } from "../../lib/BaseController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uuidSchema } from "../../utils/validator.js";
import { customerService } from "./customer.service.js";
import {
  customerAddCartItemSchema,
  customerBookingSchema,
  customerFeedbackSchema,
  customerPaymentSchema,
  customerRescheduleSchema,
  customerUpdateNotesSchema,
  customerUpdateQuantitySchema,
} from "./validators/customer.validator.js";

class CustomerController extends BaseController {
  home = asyncHandler(async (_req, res) => this.ok(res, "Home fetched successfully", { home: await customerService.home() }));
  restaurant = asyncHandler(async (_req, res) => this.ok(res, "Restaurant details fetched successfully", { restaurant: await customerService.restaurantDetails() }));
  menu = asyncHandler(async (_req, res) => this.ok(res, "Menu fetched successfully", await customerService.menu()));
  book = asyncHandler(async (req, res) => this.created(res, "Booking created successfully", { booking: await customerService.book(customerBookingSchema.parse(req.body), req.user!) }));
  reschedule = asyncHandler(async (req, res) => this.ok(res, "Booking rescheduled successfully", { booking: await customerService.reschedule(uuidSchema.parse(req.params.bookingId), customerRescheduleSchema.parse(req.body), req.user!) }));
  cancelBooking = asyncHandler(async (req, res) => this.ok(res, "Booking cancelled successfully", { booking: await customerService.cancelBooking(uuidSchema.parse(req.params.bookingId), req.user!) }));
  currentBooking = asyncHandler(async (req, res) => this.ok(res, "Current booking fetched successfully", { booking: await customerService.currentBooking(req.user!.id) }));
  currentSession = asyncHandler(async (req, res) => this.ok(res, "Current session fetched successfully", { session: await customerService.currentSession(req.user!.id, uuidSchema.parse(req.params.bookingId)) }));
  bookingHistory = asyncHandler(async (req, res) => this.ok(res, "Booking history fetched successfully", { bookings: await customerService.bookingHistory(req.user!.id) }));
  cart = asyncHandler(async (req, res) => this.ok(res, "Cart fetched successfully", { cart: await customerService.getCart(uuidSchema.parse(req.params.bookingId), req.user!) }));
  addCartItem = asyncHandler(async (req, res) => this.created(res, "Item added to cart successfully", { item: await customerService.addCartItem(customerAddCartItemSchema.parse(req.body), req.user!) }));
  updateQuantity = asyncHandler(async (req, res) => this.ok(res, "Cart item quantity updated successfully", { item: await customerService.updateCartQuantity(uuidSchema.parse(req.params.cartItemId), customerUpdateQuantitySchema.parse(req.body).quantity, req.user!) }));
  updateNotes = asyncHandler(async (req, res) => this.ok(res, "Cart item notes updated successfully", { item: await customerService.updateCartNotes(uuidSchema.parse(req.params.cartItemId), customerUpdateNotesSchema.parse(req.body).specialNotes, req.user!) }));
  removeCartItem = asyncHandler(async (req, res) => { await customerService.removeCartItem(uuidSchema.parse(req.params.cartItemId), req.user!); this.noContent(res); });
  clearCart = asyncHandler(async (req, res) => { await customerService.clearCart(uuidSchema.parse(req.params.bookingId), req.user!); this.noContent(res); });
  confirmOrder = asyncHandler(async (req, res) => this.created(res, "Order confirmed successfully", { order: await customerService.confirmOrder(uuidSchema.parse(req.params.bookingId), req.user!) }));
  orderHistory = asyncHandler(async (req, res) => this.ok(res, "Order history fetched successfully", { orders: await customerService.orderHistory(req.user!.id) }));
  orderTracking = asyncHandler(async (req, res) => this.ok(res, "Order tracking fetched successfully", { tracking: await customerService.orderTracking(req.user!.id, uuidSchema.parse(req.params.orderId)) }));
  invoiceHistory = asyncHandler(async (req, res) => this.ok(res, "Invoice history fetched successfully", { invoices: await customerService.invoiceHistory(req.user!.id) }));
  liveInvoice = asyncHandler(async (req, res) => this.ok(res, "Live invoice fetched successfully", { invoice: await customerService.liveInvoice(req.user!.id, uuidSchema.parse(req.params.bookingId)) }));
  pay = asyncHandler(async (req, res) => this.created(res, "Payment completed successfully", { payment: await customerService.pay(customerPaymentSchema.parse(req.body), req.user!) }));
  paymentHistory = asyncHandler(async (req, res) => this.ok(res, "Payment history fetched successfully", { payments: await customerService.paymentHistory(req.user!.id) }));
  profile = asyncHandler(async (req, res) => this.ok(res, "Profile fetched successfully", { profile: await customerService.profile(req.user!.id) }));
  offers = asyncHandler(async (_req, res) => this.ok(res, "Offers fetched successfully", { offers: await customerService.offers() }));
  leaderboard = asyncHandler(async (req, res) => this.ok(res, "Leaderboard fetched successfully", { leaderboard: await customerService.leaderboard(req.user!.id) }));
  playGame = asyncHandler(async (req, res) => this.created(res, "Reward claimed successfully", { reward: await customerService.playGame(uuidSchema.parse(req.params.bookingId), req.user!) }));
  feedback = asyncHandler(async (req, res) => this.created(res, "Feedback submitted successfully", { feedback: await customerService.submitFeedback(uuidSchema.parse(req.params.bookingId), customerFeedbackSchema.parse(req.body), req.user!) }));
  notifications = asyncHandler(async (req, res) => this.ok(res, "Notifications fetched successfully", { notifications: await customerService.notifications(req.user!.id) }));
  markNotificationRead = asyncHandler(async (req, res) => this.ok(res, "Notification marked as read", { result: await customerService.markNotificationRead(req.user!.id, uuidSchema.parse(req.params.notificationId)) }));
}

export const customerController = new CustomerController();
