import type { UserRole, UserStatus } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
};

export type RequestContext = {
  requestId: string;
  timestamp: Date;
  user?: AuthenticatedUser;
};
