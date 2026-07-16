// Centralizes password hashing so bcrypt settings stay consistent.
import bcrypt from "bcrypt";
import { env } from "../config/env.config.js";

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = (password: string, passwordHash: string) => {
  return bcrypt.compare(password, passwordHash);
};
