import type { UserRole, UserStatus } from "@prisma/client";
import type { RequestContext } from "./request.types.js";

declare global {
  namespace Express {
    interface User {
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string | null;
      role: UserRole;
      status: UserStatus;
      avatarUrl: string | null;
    }

    interface Request {
      user?: User;
      context: RequestContext;
    }
  }
}

export {};
