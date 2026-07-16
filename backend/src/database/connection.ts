// Wraps PostgreSQL connection lifecycle behind Prisma.
import { prisma } from "./prisma.js";
import { logger } from "../utils/logger.js";

export const connectDatabase = async () => {
  await prisma.$connect();
  logger.info("PostgreSQL connected through Prisma.");
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info("PostgreSQL disconnected.");
};
