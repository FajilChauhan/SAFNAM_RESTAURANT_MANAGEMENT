import { BaseController } from "../../lib/BaseController.js";
import { getUploadedFileUrl } from "../../services/upload/upload.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseApiQuery } from "../../utils/queryParser.js";
import { uuidSchema } from "../../utils/validator.js";
import { roomService } from "./room.service.js";
import { createRoomSchema, updateRoomSchema } from "./validators/room.validator.js";

const parseImageUrlField = (file?: Express.Multer.File, bodyImageUrl?: string | null) => {
  const uploadedUrl = getUploadedFileUrl(file);
  if (uploadedUrl) return uploadedUrl;
  if (bodyImageUrl === "" || bodyImageUrl === "null" || bodyImageUrl === null) return null;
  return bodyImageUrl;
};

class RoomController extends BaseController {
  create = asyncHandler(async (req, res) => {
    const imageUrl = parseImageUrlField(req.file, req.body.imageUrl);
    const dto = createRoomSchema.parse({
      ...req.body,
      imageUrl,
    });
    const room = await roomService.create(dto);

    this.created(res, "Room created successfully", { room });
  });

  list = asyncHandler(async (req, res) => {
    const options = parseApiQuery(req.query, ["status", "roomType"]);
    const result = await roomService.list(options);

    this.ok(res, "Rooms fetched successfully", { rooms: result.data }, result.meta);
  });

  update = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const imageUrl = parseImageUrlField(req.file, req.body.imageUrl);
    const dto = updateRoomSchema.parse({
      ...req.body,
      imageUrl,
    });
    const room = await roomService.update(id, dto);

    this.ok(res, "Room updated successfully", { room });
  });

  delete = asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    await roomService.delete(id);

    this.ok(res, "Room deleted successfully");
  });
}

export const roomController = new RoomController();
