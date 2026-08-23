import { describe, expect, it } from "vitest";
import { LLM_PROVIDERS } from "./llm-providers";
import { LLM_PROVIDER_IDS, LLMProviderSchema } from "./types";

describe("LLMProviderSchema", () => {
  it.each([...LLM_PROVIDER_IDS])("accepts the valid provider %s", (id) => {
    expect(LLMProviderSchema.parse(id)).toBe(id);
  });

  it.each(["azure", "", "OpenAI"])("rejects the invalid provider %j", (value) => {
    expect(LLMProviderSchema.safeParse(value).success).toBe(false);
  });
});

describe("LLM_PROVIDERS config invariants", () => {
  it("defines exactly the providers listed in LLM_PROVIDER_IDS", () => {
    expect(LLM_PROVIDERS.map((p) => p.id).sort()).toEqual([...LLM_PROVIDER_IDS].sort());
  });

  it.each(LLM_PROVIDERS)("includes $id defaultModel within its models list", (provider) => {
    expect(provider.models).toContain(provider.defaultModel);
  });

  it.each(LLM_PROVIDERS)("has a unique, non-empty models list for $id", (provider) => {
    expect(provider.models.length).toBeGreaterThan(0);
    expect(new Set(provider.models).size).toBe(provider.models.length);
  });

  it.each(LLM_PROVIDERS)("exposes an https key url for $id", (provider) => {
    expect(provider.keyUrl).toMatch(/^https:\/\//);
  });
});
