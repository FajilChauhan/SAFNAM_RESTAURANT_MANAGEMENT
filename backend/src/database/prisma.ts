// Exposes a single PrismaClient instance for the whole application lifecycle.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
