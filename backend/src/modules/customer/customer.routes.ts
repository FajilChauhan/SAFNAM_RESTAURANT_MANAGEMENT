// Customer routes provide one authenticated customer experience platform.
import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { customerController } from "./customer.controller.js";

export const customerRouter = Router();

// Public discovery endpoints for the customer home experience.
customerRouter.get("/home", customerController.home);
customerRouter.get("/restaurant", customerController.restaurant);
customerRouter.get("/menu", customerController.menu);
customerRouter.get("/offers", customerController.offers);
customerRouter.get("/leaderboard", customerController.leaderboard);

customerRouter.use(authenticate, authorize(UserRole.CUSTOMER));

customerRouter.post("/bookings", customerController.book);
customerRouter.patch("/bookings/:bookingId/reschedule", customerController.reschedule);
customerRouter.post("/bookings/:bookingId/cancel", customerController.cancelBooking);
customerRouter.get("/bookings/current", customerController.currentBooking);
customerRouter.get("/bookings/history", customerController.bookingHistory);
customerRouter.get("/bookings/:bookingId/session", customerController.currentSession);
customerRouter.get("/bookings/:bookingId/cart", customerController.cart);
customerRouter.delete("/bookings/:bookingId/cart", customerController.clearCart);
customerRouter.post("/cart/items", customerController.addCartItem);
customerRouter.patch("/cart/items/:cartItemId/quantity", customerController.updateQuantity);
customerRouter.patch("/cart/items/:cartItemId/notes", customerController.updateNotes);
customerRouter.delete("/cart/items/:cartItemId", customerController.removeCartItem);
customerRouter.post("/bookings/:bookingId/orders/confirm", customerController.confirmOrder);
customerRouter.get("/orders/history", customerController.orderHistory);
customerRouter.get("/orders/:orderId/tracking", customerController.orderTracking);
customerRouter.get("/invoices/history", customerController.invoiceHistory);
customerRouter.get("/bookings/:bookingId/invoice/live", customerController.liveInvoice);
customerRouter.post("/payments", customerController.pay);
customerRouter.get("/payments/history", customerController.paymentHistory);
customerRouter.get("/profile", customerController.profile);
customerRouter.post("/bookings/:bookingId/game/play", customerController.playGame);
customerRouter.post("/bookings/:bookingId/feedback", customerController.feedback);
customerRouter.get("/notifications", customerController.notifications);
customerRouter.patch("/notifications/:notificationId/read", customerController.markNotificationRead);
