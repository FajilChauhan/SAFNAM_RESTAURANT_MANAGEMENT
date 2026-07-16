import type { UserRole, UserStatus } from "@prisma/client";

export type RegisterDto = {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password: string;
};

export type LoginDto = {
  phoneNumber: string;
  password: string;
};

export type ChangePasswordDto = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AuthUserDto = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
};
