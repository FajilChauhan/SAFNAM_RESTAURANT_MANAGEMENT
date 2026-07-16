// Registers root-level routes before feature modules are introduced.
import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { healthRouter } from "./health.route.js";

export const router = Router();

router.use(healthRouter);
router.use("/api/auth", authRouter);
