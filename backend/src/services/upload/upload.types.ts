export type UploadDestination = "memory" | "local";

export type UploadConfig = {
  destination: UploadDestination;
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
