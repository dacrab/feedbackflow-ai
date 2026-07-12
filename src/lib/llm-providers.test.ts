import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODELS,
  LLM_PROVIDERS,
  LLMProviderSchema,
  PROVIDER_KEY_URLS,
  PROVIDER_LABELS,
  PROVIDER_MODELS,
} from "./llm-providers";
import { LLM_PROVIDER_IDS } from "./types";

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

describe("derived provider maps", () => {
  it("maps each provider id to its default model", () => {
    for (const p of LLM_PROVIDERS) {
      expect(DEFAULT_MODELS[p.id]).toBe(p.defaultModel);
    }
  });

  it("maps each provider id to its models and key url", () => {
    for (const p of LLM_PROVIDERS) {
      expect(PROVIDER_MODELS[p.id]).toEqual(p.models);
      expect(PROVIDER_KEY_URLS[p.id]).toBe(p.keyUrl);
    }
  });

  it("builds labels preserving provider order", () => {
    expect(PROVIDER_LABELS).toEqual(LLM_PROVIDERS.map((p) => ({ value: p.id, label: p.label })));
  });
});
