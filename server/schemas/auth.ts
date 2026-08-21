import { z } from "zod";

const arabicOrLatinName = z.string().trim().min(2, "الاسم يجب أن يحتوي حرفين على الأقل").max(120, "الاسم طويل جداً");
const password = z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(72, "كلمة المرور طويلة جداً");

export const loginSchema = z.object({ email: z.string().trim().email("أدخل بريداً إلكترونياً صحيحاً").max(320), password });
export const registerSchema = z.object({ fullName: arabicOrLatinName, email: z.string().trim().email("أدخل بريداً إلكترونياً صحيحاً").max(320), password, role: z.enum(["job_seeker", "employer"]), acceptedTerms: z.literal(true, { error: "يجب قبول إخلاء مسؤولية المنصة للمتابعة" }) });
export const phoneOtpSchema = z.object({ phone: z.string().trim().regex(/^\+[1-9]\d{7,31}$/, "استخدم رقم الهاتف بصيغة دولية، مثل +212600000000") });
export const verifyOtpSchema = z.object({ phone: z.string().trim().regex(/^\+[1-9]\d{7,31}$/), token: z.string().trim().length(6, "أدخل رمز التحقق المكوّن من 6 أرقام") });
