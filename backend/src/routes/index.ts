// Registers root-level routes before feature modules are introduced.
import { Router } from "express";
import { healthRouter } from "./health.route.js";

export const router = Router();

router.use(healthRouter);
