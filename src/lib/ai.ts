import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// llama-3.3-70b-versatile was retired Aug 16, 2026. Using Groq's official
// replacement (openai/gpt-oss-120b). Override via env if desired.
export const GROQ_FAST_MODEL =
  process.env.GROQ_FAST_MODEL ?? "openai/gpt-oss-120b";
export const GROQ_SMART_MODEL =
  process.env.GROQ_SMART_MODEL ?? "openai/gpt-oss-120b";

const groq = createOpenAICompatible({
  name: "groq",
  baseURL: GROQ_BASE_URL,
  apiKey: process.env.GROQ_API_KEY ?? "",
});

/**
 * Returns a Groq language model. Returns null when GROQ_API_KEY is missing
 * so callers can surface a friendly "AI not configured" message.
 */
export function getGroqModel(id: string = GROQ_FAST_MODEL): LanguageModel | null {
  if (!process.env.GROQ_API_KEY) return null;
  return groq(id);
}

export function aiUnavailableError() {
  return {
    error:
      "AI is not configured. Add your GROQ_API_KEY environment variable.",
    data: null as null,
  };
}