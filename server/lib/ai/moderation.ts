import type { AISafetyAdvisory } from "@shared/brikouli.types";
import { hazardousGigWarning } from "../../schemas/domain";
import { invokeStructuredAI } from "./ai-client";
import { gigSafetyPrompt, gigSafetySystemPrompt } from "./prompts";

const scamPattern = /(ادفع\s+(رسوم|مبلغا)|تحويل\s+مالي|بطاق[هة]\s+بنكي[هة]|ربح\s+مضمون|وظيف[هة]\s+مضمون[هة]|crypto|bitcoin)/i;

export async function analyzeGigSafety(input: { title: string; description: string; category: string }): Promise<AISafetyAdvisory> {
  const content = `${input.title} ${input.description}`;
  const deterministic: AISafetyAdvisory = hazardousGigWarning(input) ? { riskLevel: "blocked", reason: hazardousGigWarning(input)!, confidence: 1, source: "deterministic" } : scamPattern.test(content) ? { riskLevel: "review", reason: "تتضمن الفرصة مؤشراً مالياً أو وعداً غير قابل للتحقق ويتطلب مراجعة بشرية.", confidence: .82, source: "deterministic" } : { riskLevel: "safe", reason: "لا توجد إشارة آلية واضحة تستدعي التصعيد. تبقى المراجعة البشرية مطلوبة عند وجود بلاغ.", confidence: .55, source: "deterministic" };
  if (deterministic.riskLevel !== "safe") return deterministic;
  const ai = await invokeStructuredAI<{ riskLevel: "safe" | "review" | "blocked"; reason: string; confidence: number }>("gig_safety_advisory", [{ role: "system", content: gigSafetySystemPrompt }, { role: "user", content: gigSafetyPrompt(input) }], { type: "object", properties: { riskLevel: { type: "string", enum: ["safe", "review", "blocked"] }, reason: { type: "string" }, confidence: { type: "number" } }, required: ["riskLevel", "reason", "confidence"], additionalProperties: false });
  if (!ai) return deterministic;
  return { riskLevel: ai.riskLevel, reason: ai.reason.slice(0, 500), confidence: Math.max(0, Math.min(1, ai.confidence)), source: "ai" };
}
