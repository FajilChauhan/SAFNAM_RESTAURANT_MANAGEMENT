import crypto from "node:crypto";
import { TokenExpiredError } from "jsonwebtoken";
import { UserStatus } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signJwt, verifyJwt } from "../../utils/jwt.js";
import { toAuthUserDto } from "./auth.mapper.js";
import { AuthRepository } from "./auth.repository.js";
import type { AuthUserDto, ChangePasswordDto, LoginDto, RegisterDto } from "./dto/auth.dto.js";
import type { IAuthService } from "./interfaces/auth.interfaces.js";
import type { RequestMetadata, TokenPair } from "./types/auth.types.js";

const REFRESH_TOKEN_TTL_DAYS = 30;

export class AuthService implements IAuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(dto: RegisterDto): Promise<AuthUserDto> {
    const existingPhoneUser = await this.authRepository.findUserByPhoneNumber(dto.phoneNumber);

    if (existingPhoneUser) {
      throw new ApiError(409, "Phone number is already registered");
    }

    if (dto.email) {
      const existingEmailUser = await this.authRepository.findUserByEmail(dto.email);

      if (existingEmailUser) {
        throw new ApiError(409, "Email is already registered");
      }
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.authRepository.createCustomer({
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      passwordHash,
    });

    return toAuthUserDto(user);
  }

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<TokenPair & { user: AuthUserDto }> {
    const user = await this.authRepository.findUserByPhoneNumber(dto.phoneNumber);
    const passwordHash = user?.passwordHash ?? "$2b$12$KIXJgn3IuULxXFjIe.zoMeA8UF5j.TnL0nFIqrQPcqeNWUzQPvRVa";
    const isPasswordValid = await comparePassword(dto.password, passwordHash);

    if (!user || !isPasswordValid) {
      throw new ApiError(401, "Invalid phone number or password");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, "Account is not active");
    }

    await this.authRepository.updateLastLogin(user.id);

    const tokens = await this.createTokenPair(user.id, user.role, metadata);

    return {
      ...tokens,
      user: toAuthUserDto(user),
    };
  }

  async refreshAccessToken(refreshToken: string, metadata: RequestMetadata): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(refreshToken);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const storedToken = await this.authRepository.findRefreshTokenByHash(refreshTokenHash);

    if (!storedToken || storedToken.userId !== payload.sub || storedToken.revokedAt) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      await this.safeDeleteRefreshToken(refreshTokenHash);
      throw new ApiError(401, "Refresh token expired");
    }

    if (storedToken.user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, "Account is not active");
    }

    await this.authRepository.deleteRefreshTokenByHash(refreshTokenHash);

    return this.createTokenPair(storedToken.user.id, storedToken.user.role, metadata);
  }

  async logoutCurrentDevice(refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    await this.safeDeleteRefreshToken(refreshTokenHash);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.authRepository.deleteRefreshTokensByUserId(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.authRepository.findActiveUserById(userId);

    if (!user) {
      throw new ApiError(401, "Authenticated user was not found");
    }

    const isOldPasswordValid = await comparePassword(dto.oldPassword, user.passwordHash);

    if (!isOldPasswordValid) {
      throw new ApiError(400, "Old password is incorrect");
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.authRepository.updatePassword(user.id, passwordHash);
    await this.authRepository.deleteRefreshTokensByUserId(user.id);
  }

  async getCurrentUser(userId: string): Promise<AuthUserDto> {
    const user = await this.authRepository.findActiveUserById(userId);

    if (!user) {
      throw new ApiError(401, "Authenticated user was not found");
    }

    return toAuthUserDto(user);
  }

  private async createTokenPair(
    userId: string,
    role: string,
    metadata: RequestMetadata,
  ): Promise<TokenPair> {
    const accessToken = signJwt({ sub: userId, role, type: "access" });
    const refreshToken = signJwt({ sub: userId, role, type: "refresh" });

    await this.authRepository.createRefreshToken({
      userId,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      deviceName: metadata.deviceName,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(refreshToken: string) {
    try {
      const payload = verifyJwt(refreshToken, "refresh");

      if (payload.type !== "refresh") {
        throw new ApiError(401, "Invalid refresh token");
      }

      return payload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ApiError(401, "Refresh token expired");
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, "Invalid refresh token");
    }
  }

  private hashRefreshToken(refreshToken: string) {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
  }

  private getRefreshTokenExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return expiresAt;
  }

  private async safeDeleteRefreshToken(refreshTokenHash: string) {
    try {
      await this.authRepository.deleteRefreshTokenByHash(refreshTokenHash);
    } catch {
      return;
    }
  }
}

export const authService = new AuthService(new AuthRepository());
