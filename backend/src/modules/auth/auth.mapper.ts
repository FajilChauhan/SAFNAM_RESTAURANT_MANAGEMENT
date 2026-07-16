import type { User } from "@prisma/client";
import type { AuthUserDto } from "./dto/auth.dto.js";

export const toAuthUserDto = (user: User): AuthUserDto => ({
  id: user.id,
  name: user.fullName,
  phone: user.phoneNumber,
  email: user.email,
  role: user.role,
  status: user.status,
  avatar: user.avatarUrl,
});
