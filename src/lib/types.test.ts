import { describe, expect, it } from "vitest";
import { isLLMProvider } from "./types";

describe("isLLMProvider", () => {
  it("returns true for valid providers", () => {
    expect(isLLMProvider("google")).toBe(true);
    expect(isLLMProvider("openai")).toBe(true);
    expect(isLLMProvider("anthropic")).toBe(true);
    expect(isLLMProvider("openrouter")).toBe(true);
  });

  it("returns false for invalid values", () => {
    expect(isLLMProvider("azure")).toBe(false);
    expect(isLLMProvider("")).toBe(false);
    expect(isLLMProvider(42)).toBe(false);
    expect(isLLMProvider(null)).toBe(false);
    expect(isLLMProvider(undefined)).toBe(false);
    expect(isLLMProvider({})).toBe(false);
    expect(isLLMProvider([])).toBe(false);
  });
});
