// Encapsulates JWT signing and verification for auth token consistency.
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config.js";

export type JwtTokenType = "access" | "refresh";

export type JwtPayload = {
  sub: string;
  role: string;
  type: JwtTokenType;
};

const getSecret = (type: JwtTokenType) =>
  type === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;

const getExpiresIn = (type: JwtTokenType) =>
  type === "access" ? env.JWT_ACCESS_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN;

export const signJwt = (payload: JwtPayload) => {
  return jwt.sign(payload, getSecret(payload.type), {
    expiresIn: getExpiresIn(payload.type) as SignOptions["expiresIn"],
  });
};

export const verifyJwt = (token: string, type: JwtTokenType) => {
  return jwt.verify(token, getSecret(type)) as JwtPayload;
};
