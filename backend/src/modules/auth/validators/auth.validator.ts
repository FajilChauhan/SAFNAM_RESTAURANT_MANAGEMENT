import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or less");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  phoneNumber: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  email: z.string().trim().email().max(255).optional(),
  password: passwordSchema,
})
  .superRefine((data, ctx) => {
    if (!data.fullName && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full name is required",
        path: ["fullName"],
      });
    }

    if (!data.phoneNumber && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required",
        path: ["phoneNumber"],
      });
    }
  })
  .transform((data) => ({
    fullName: data.fullName ?? data.name ?? "",
    phoneNumber: data.phoneNumber ?? data.phone ?? "",
    email: data.email,
    password: data.password,
  }));

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).optional(),
  phoneNumber: phoneSchema.optional(),
  password: z.string().min(1, "Password is required"),
})
  .superRefine((data, ctx) => {
    if (!data.email && !data.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email or phone number is required",
        path: ["email"],
      });
    }
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });
