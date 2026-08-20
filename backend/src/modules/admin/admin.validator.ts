import { DiscountType, MenuEntityStatus, OfferApplicableTo, OfferType, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const staffRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN] as const;
const formBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());
const formArray = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      if (!value.trim()) return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return value;
  }, z.array(itemSchema));

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional(),
  phoneNumber: z.string().trim().min(7).max(20),
  password: z.string().min(8).max(128),
  role: z.enum(staffRoles),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  avatarUrl: z.string().trim().url().max(500).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ password: true })
  .partial()
  .extend({ password: z.string().min(8).max(128).optional() })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const offerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  type: z.nativeEnum(OfferType).optional(),
  status: z.nativeEnum(MenuEntityStatus).optional(),
  applicableTo: z.nativeEnum(OfferApplicableTo).optional(),
});

const offerBaseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  code: z.string().trim().min(2).max(40).optional(),
  type: z.nativeEnum(OfferType),
  applicableTo: z.nativeEnum(OfferApplicableTo).default(OfferApplicableTo.BOTH),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().positive(),
  minSpend: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().positive().optional(),
  imageUrl: z.string().trim().url().max(500).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: z.nativeEnum(MenuEntityStatus).default(MenuEntityStatus.ACTIVE),
  allFloors: formBoolean.default(true),
  floorIds: formArray(z.string().uuid()).default([]),
  allRoomTypes: formBoolean.default(true),
  roomTypes: formArray(z.string().trim().min(1).max(80)).default([]),
});

const validateOfferScope = (data: z.infer<typeof offerBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.startsAt > data.endsAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Offer start date cannot be after end date", path: ["endsAt"] });
  }
  if ((data.applicableTo === OfferApplicableTo.TABLE || data.applicableTo === OfferApplicableTo.BOTH) && !data.allFloors && data.floorIds.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one floor or choose all floors", path: ["floorIds"] });
  }
  if ((data.applicableTo === OfferApplicableTo.ROOM || data.applicableTo === OfferApplicableTo.BOTH) && !data.allRoomTypes && data.roomTypes.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one room category or choose all room categories", path: ["roomTypes"] });
  }
  if (data.applicableTo === OfferApplicableTo.TABLE && !data.allRoomTypes && data.roomTypes.length > 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Room categories cannot be assigned to a table-only offer", path: ["roomTypes"] });
  }
  if (data.applicableTo === OfferApplicableTo.ROOM && !data.allFloors && data.floorIds.length > 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Floors cannot be assigned to a room-only offer", path: ["floorIds"] });
  }
};

export const createOfferSchema = offerBaseSchema.superRefine(validateOfferScope);

export const updateOfferSchema = offerBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required")
  .refine((data) => !data.startsAt || !data.endsAt || data.startsAt <= data.endsAt, {
    message: "Offer start date cannot be after end date",
    path: ["endsAt"],
  });

export type AdminListQueryDto = z.infer<typeof adminListQuerySchema>;
export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
export type OfferListQueryDto = z.infer<typeof offerListQuerySchema>;
export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type UpdateOfferDto = z.infer<typeof updateOfferSchema>;

export const updateRolePermissionsSchema = z.object({
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string().trim().min(1)).default([]),
});
