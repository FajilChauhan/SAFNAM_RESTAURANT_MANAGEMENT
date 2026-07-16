import type { RequestMetadata, TokenPair } from "../types/auth.types.js";
import type { AuthUserDto, ChangePasswordDto, LoginDto, RegisterDto } from "../dto/auth.dto.js";

export interface IAuthService {
  register(dto: RegisterDto): Promise<AuthUserDto>;
  login(dto: LoginDto, metadata: RequestMetadata): Promise<TokenPair & { user: AuthUserDto }>;
  refreshAccessToken(refreshToken: string, metadata: RequestMetadata): Promise<TokenPair>;
  logoutCurrentDevice(refreshToken: string): Promise<void>;
  logoutAllDevices(userId: string): Promise<void>;
  changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
  getCurrentUser(userId: string): Promise<AuthUserDto>;
}
