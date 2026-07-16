import type { Prisma, RefreshToken, User } from "@prisma/client";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export class AuthRepository {
  findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findActiveUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, status: UserStatus.ACTIVE },
    });
  }

  findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phoneNumber } });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  createCustomer(data: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
  }

  updateLastLogin(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  updatePassword(userId: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  findRefreshTokenByHash(refreshTokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  deleteRefreshTokenByHash(refreshTokenHash: string): Promise<RefreshToken> {
    return prisma.refreshToken.delete({ where: { refreshTokenHash } });
  }

  deleteRefreshTokensByUserId(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
