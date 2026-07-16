import type { UploadModule } from "../services/upload/upload.types.js";

export type StoreFileInput = {
  module: UploadModule;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export type StoredFile = {
  path: string;
  url: string;
  provider: string;
};

export interface StorageProvider {
  store(input: StoreFileInput): Promise<StoredFile>;
}
