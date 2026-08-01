import { z } from "zod";
import { LLM_PROVIDER_IDS, type LLMProvider } from "@/lib/types";

export const LLMProviderSchema = z.enum(LLM_PROVIDER_IDS);

export interface LLMProviderMeta {
  id: LLMProvider;
  label: string;
  defaultModel: string;
  models: string[];
  keyUrl: string;
}

export const LLM_PROVIDERS: LLMProviderMeta[] = [
  {
    id: "openrouter",
    label: "OpenRouter (free)",
    defaultModel: "openrouter/auto",
    models: [
      "openrouter/auto",
      "google/gemini-3.5-flash",
      "google/gemini-3.1-flash-lite",
      "google/gemini-2.5-flash",
      "openai/gpt-5.4-mini",
      "openai/gpt-5.4-nano",
      "anthropic/claude-haiku-4-5",
      "meta-llama/llama-4-maverick",
      "deepseek/deepseek-chat-v3-0324:free",
      "mistralai/mistral-small-3.2-24b-instruct:free",
    ],
    keyUrl: "https://openrouter.ai/keys",
  },
  {
    id: "google",
    label: "Google Gemini",
    defaultModel: "gemini-3.5-flash",
    models: [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3.1-pro-preview",
    ],
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-5.4-nano",
    models: ["gpt-5.4-nano", "gpt-5.4-mini", "gpt-5.4", "gpt-5.5"],
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    defaultModel: "claude-haiku-4-5",
    models: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-8"],
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
];
