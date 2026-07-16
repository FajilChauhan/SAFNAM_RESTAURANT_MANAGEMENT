export type UploadDestination = "memory" | "local";
export type StorageProvider = "local" | "cloudinary" | "s3" | "r2";
export type UploadModule = "menu/category" | "menu/item" | "restaurant" | "profile" | "gallery" | "offers";

export type UploadConfig = {
  destination: UploadDestination;
  module: UploadModule;
  fieldName: string;
  maxFileSizeInBytes: number;
  allowedMimeTypes: string[];
};

export type UploadedFile = {
  originalName: string;
  mimeType: string;
  size: number;
  filename?: string;
  path?: string;
  buffer?: Buffer;
};
