import { z } from "zod";

export const profileSchema = z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().regex(/^\+[1-9]\d{7,31}$/).optional().nullable(), city: z.string().trim().max(120).optional().nullable(), neighborhood: z.string().trim().max(120).optional().nullable(), avatarUrl: z.string().url().max(2048).optional().nullable() });
export const gigSchema = z.object({ title: z.string().trim().min(4).max(140), description: z.string().trim().min(12).max(4000), category: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(120), neighborhood: z.string().trim().max(120).optional().nullable(), latitude: z.number().min(-90).max(90).optional().nullable(), longitude: z.number().min(-180).max(180).optional().nullable(), payment: z.number().positive().max(99999999), paymentType: z.enum(["fixed", "hourly"]), duration: z.string().trim().min(1).max(80) });
export const applicationSchema = z.object({ gigId: z.string().uuid() });
