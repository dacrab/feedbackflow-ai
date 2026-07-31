import { describe, expect, it } from "vitest";
import {
  FEEDBACK_STATUS_OPTIONS,
  isFeedbackStatus,
  isLLMProvider,
  LLM_PROVIDER_IDS,
} from "./types";

describe("isLLMProvider", () => {
  it.each(LLM_PROVIDER_IDS)("returns true for %s", (id) => {
    expect(isLLMProvider(id)).toBe(true);
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

describe("isFeedbackStatus", () => {
  it.each(FEEDBACK_STATUS_OPTIONS)("returns true for %s", (status) => {
    expect(isFeedbackStatus(status)).toBe(true);
  });

  it("returns false for invalid values", () => {
    expect(isFeedbackStatus("new")).toBe(false);
    expect(isFeedbackStatus("")).toBe(false);
    expect(isFeedbackStatus(42)).toBe(false);
    expect(isFeedbackStatus(null)).toBe(false);
    expect(isFeedbackStatus(undefined)).toBe(false);
    expect(isFeedbackStatus({})).toBe(false);
    expect(isFeedbackStatus([])).toBe(false);
  });
});
