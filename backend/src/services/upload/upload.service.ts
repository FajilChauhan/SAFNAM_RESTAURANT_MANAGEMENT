import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { ApiError } from "../../utils/ApiError.js";
import type { UploadConfig } from "./upload.types.js";

const UPLOAD_ROOT = "uploads";

const createStorage = (destination: UploadConfig["destination"]) => {
  if (destination === "memory") {
    return multer.memoryStorage();
  }

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      const uploadPath = path.join(UPLOAD_ROOT, "menu");
      fs.mkdirSync(uploadPath, { recursive: true });
      callback(null, uploadPath);
    },
    filename: (_req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      callback(null, `${Date.now()}-${safeName}`);
    },
  });
};

export class UploadService {
  createSingleUpload(config: UploadConfig) {
    const upload = multer({
      storage: createStorage(config.destination),
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

  return `/uploads/menu/${file.filename}`;
};
