import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../../config/env.config.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { ApiError } from "../../utils/ApiError.js";
import type { UploadConfig } from "./upload.types.js";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getExtension = (fileName: string) => path.extname(fileName).toLowerCase();

const createUniqueFileName = (originalName: string) => {
  const extension = getExtension(originalName);
  return `${Date.now()}-${crypto.randomUUID()}${extension}`;
};

const createStorage = (config: UploadConfig) => {
  const destination = config.destination;

  if (destination === "memory") {
    return multer.memoryStorage();
  }

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      const uploadPath = path.join(env.UPLOAD_BASE_PATH, config.module);
      fs.mkdirSync(uploadPath, { recursive: true });
      callback(null, uploadPath);
    },
    filename: (_req, file, callback) => {
      callback(null, createUniqueFileName(file.originalname));
    },
  });
};

export class UploadService {
  createSingleUpload(config: UploadConfig) {
    if (env.STORAGE_PROVIDER !== "local") {
      throw new ApiError(501, `${env.STORAGE_PROVIDER} storage is not implemented yet`);
    }

    const upload = multer({
      storage: createStorage(config),
      limits: {
        fileSize: config.maxFileSizeInBytes,
      },
      fileFilter: (_req, file, callback) => {
        if (!config.allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new ApiError(400, "Unsupported file type", ERROR_CODES.FILE_UPLOAD_ERROR, {
              mimeType: file.mimetype,
            }),
          );
          return;
        }

        callback(null, true);
      },
    });

    return upload.single(config.fieldName);
  }
}

export const uploadService = new UploadService();

export const getUploadedFileUrl = (file?: Express.Multer.File) => {
  if (!file?.filename) {
    return undefined;
  }

  const normalizedPath = file.path.replace(/\\/g, "/");
  return `${env.UPLOAD_PUBLIC_PATH}/${normalizedPath.replace(`${env.UPLOAD_BASE_PATH}/`, "")}`;
};

export const imageUploadConfig = (module: UploadConfig["module"], fieldName = "image"): UploadConfig => ({
  destination: "local",
  module,
  fieldName,
  maxFileSizeInBytes: env.MAX_IMAGE_SIZE_BYTES,
  allowedMimeTypes: IMAGE_MIME_TYPES,
});
