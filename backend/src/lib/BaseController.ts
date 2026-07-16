import type { Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";

export abstract class BaseController {
  protected ok<T>(res: Response, message: string, data?: T, meta?: unknown) {
    return res.status(200).json(ApiResponse.success(message, data, meta));
  }

  protected created<T>(res: Response, message: string, data?: T) {
    return res.status(201).json(ApiResponse.success(message, data));
  }

  protected noContent(res: Response) {
    return res.status(204).send();
  }
}
