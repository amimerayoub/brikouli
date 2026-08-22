import { invokeLLM, listLLMModels } from "../../_core/llm";
import { logEvent, logError } from "../monitoring/logger";

export function isAIEnabled() { return process.env.BRIKOULI_AI_ENABLED === "true"; }

export async function invokeStructuredAI<T>(purpose: string, messages: Array<{ role: "system" | "user"; content: string }>, schema: Record<string, unknown>): Promise<T | null> {
  if (!isAIEnabled()) return null;
  try {
    const models = await listLLMModels();
    const model = models.data.find(item => item.id === "gpt-5-mini")?.id ?? models.data[0]?.id;
    if (!model) return null;
    const response = await invokeLLM({ model, messages, response_format: { type: "json_schema", json_schema: { name: purpose, strict: true, schema } } });
    const content = response.choices[0]?.message.content;
    if (typeof content !== "string" || !content) return null;
    const parsed = JSON.parse(content) as T;
    logEvent("ai.response", { purpose, model });
    return parsed;
  } catch (error) {
    logError("ai.request_failed", error, { purpose });
    return null;
  }
}
