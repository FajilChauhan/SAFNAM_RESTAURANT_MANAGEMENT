import { DiscountType, MenuEntityStatus, OfferType, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const staffRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION, UserRole.KITCHEN] as const;

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
});

const offerBaseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  code: z.string().trim().min(2).max(40).optional(),
  type: z.nativeEnum(OfferType),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().positive(),
  minSpend: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().positive().optional(),
  imageUrl: z.string().trim().url().max(500).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: z.nativeEnum(MenuEntityStatus).default(MenuEntityStatus.ACTIVE),
});

export const createOfferSchema = offerBaseSchema.refine((data) => data.startsAt <= data.endsAt, {
  message: "Offer start date cannot be after end date",
  path: ["endsAt"],
});

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
