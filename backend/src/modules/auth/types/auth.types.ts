export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type RequestMetadata = {
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
};
