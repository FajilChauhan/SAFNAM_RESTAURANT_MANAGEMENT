// Registers root-level routes before feature modules are introduced.
import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { checkoutRouter } from "../modules/checkout/checkout.routes.js";
import { invoiceRouter } from "../modules/bills/invoice.routes.js";
import { bookingRouter } from "../modules/bookings/booking.routes.js";
import { floorRouter } from "../modules/floors/floor.routes.js";
import { kitchenRouter } from "../modules/kitchen/kitchen.routes.js";
import { menuRouter } from "../modules/menu/menu.routes.js";
import { orderRouter } from "../modules/orders/order.routes.js";
import { paymentRouter } from "../modules/payments/payment.routes.js";
import { restaurantRouter } from "../modules/restaurant/restaurant.routes.js";
import { roomRouter } from "../modules/rooms/room.routes.js";
import { tableRouter } from "../modules/tables/table.routes.js";
import { healthRouter } from "./health.route.js";

export const router = Router();

router.use(healthRouter);
router.use("/api/auth", authRouter);
router.use("/api/checkout", checkoutRouter);
router.use("/api/invoices", invoiceRouter);
router.use("/api/bookings", bookingRouter);
router.use("/api/kitchen", kitchenRouter);
router.use("/api/menu", menuRouter);
router.use("/api/orders", orderRouter);
router.use("/api/payments", paymentRouter);
router.use("/api/restaurant", restaurantRouter);
router.use("/api/floors", floorRouter);
router.use("/api/tables", tableRouter);
router.use("/api/rooms", roomRouter);
