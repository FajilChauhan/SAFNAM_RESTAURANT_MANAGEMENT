// Creates and configures the Express application without starting the HTTP server.
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { corsOptions } from "./config/cors.config.js";
import { env } from "./config/env.config.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { requestContextMiddleware } from "./middlewares/requestContext.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import { router } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(cookieParser());
  app.use(env.UPLOAD_PUBLIC_PATH, express.static(path.resolve(env.UPLOAD_BASE_PATH)));
  app.use(express.json({ limit: env.JSON_LIMIT }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestContextMiddleware);
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(requestLogger);

  app.use(router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
