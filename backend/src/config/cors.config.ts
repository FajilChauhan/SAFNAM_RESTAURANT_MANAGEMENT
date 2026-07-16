// Keeps CORS policy in one place so allowed clients can be changed safely.
import type { CorsOptions } from "cors";
import { env } from "./env.config.js";

export const corsOptions: CorsOptions = {
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
