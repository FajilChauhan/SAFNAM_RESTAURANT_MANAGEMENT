// Starts the API server and owns lifecycle concerns such as database connection and shutdown.
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.config.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { logger } from "./utils/logger.js";

const app = createApp();
const server = createServer(app);

const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully.`);

  server.close(async () => {
    await disconnectDatabase();
    logger.info("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  void shutdown("uncaughtException");
});

await connectDatabase();

server.listen(env.PORT, () => {
  logger.info(`SAFNAM Restaurant API running on port ${env.PORT}`);
});
