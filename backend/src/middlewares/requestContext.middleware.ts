import crypto from "node:crypto";
import type { RequestHandler } from "express";

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.header("x-request-id");
  const requestId = incomingRequestId?.trim() || crypto.randomUUID();

  req.context = {
    requestId,
    timestamp: new Date(),
    user: req.user,
  };

  res.setHeader("x-request-id", requestId);
  next();
};
