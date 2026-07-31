import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cn,
  formatDateUTC,
  getDateNHoursAgo,
  handleActionError,
  sentimentColor,
  sevColor,
  sevLabel,
  timeAgo,
  withRetry,
} from "./utils";

describe("cn", () => {
  it("merges classes", () => expect(cn("foo", "bar")).toBe("foo bar"));
  it("drops falsy values", () => expect(cn("foo", false && "bar", "baz")).toBe("foo baz"));
  it("drops 0", () => expect(cn("foo", 0, "bar")).toBe("foo bar"));
  it("drops null and undefined", () => expect(cn("a", null, undefined, "b")).toBe("a b"));
  it("returns empty string for all falsy", () => expect(cn(false, null, undefined, 0)).toBe(""));
  it("last Tailwind class wins", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("formatDateUTC", () => {
  it("formats date in UTC", () => {
    expect(formatDateUTC("2024-06-15T14:30:00.000Z")).toBe("Jun 15, 2024, 02:30 PM");
    expect(formatDateUTC("2024-01-01T00:00:00.000Z")).toBe("Jan 01, 2024, 12:00 AM");
  });
});

describe("sevColor", () => {
  it.each([
    [5, "text-red-500"],
    [4, "text-red-500"],
    [3, "text-orange-500"],
    [2, "text-muted-foreground"],
    [1, "text-muted-foreground"],
  ])("returns %s for severity %s", (severity, expected) => {
    expect(sevColor(severity)).toBe(expected);
  });
});

describe("sevLabel", () => {
  it.each([
    [5, "high severity"],
    [4, "high severity"],
    [3, "medium severity"],
    [2, "low severity"],
    [1, "low severity"],
  ])("returns '%s' for severity %s", (severity, expected) => {
    expect(sevLabel(severity)).toBe(expected);
  });
});

describe("sentimentColor", () => {
  it.each([
    ["positive", "text-green-500"],
    ["neutral", "text-muted-foreground"],
    ["negative", "text-red-500"],
  ])("returns %s for %s", (sentiment, expected) => {
    expect(sentimentColor(sentiment)).toBe(expected);
  });
});

describe("timeAgo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns seconds ago", () => {
    vi.setSystemTime(new Date("2024-01-10T12:00:30.000Z"));
    expect(timeAgo(new Date("2024-01-10T12:00:00.000Z"))).toBe("30s ago");
  });

  it("returns minutes ago", () => {
    vi.setSystemTime(new Date("2024-01-10T12:05:00.000Z"));
    expect(timeAgo("2024-01-10T12:00:00.000Z")).toBe("5m ago");
  });

  it("returns hours ago", () => {
    vi.setSystemTime(new Date("2024-01-10T15:00:00.000Z"));
    expect(timeAgo("2024-01-10T12:00:00.000Z")).toBe("3h ago");
  });

  it("returns days ago", () => {
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
    expect(timeAgo("2024-01-10T12:00:00.000Z")).toBe("5d ago");
  });
});

describe("getDateNHoursAgo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns ISO string exactly N hours ago", () => {
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
    expect(getDateNHoursAgo(2)).toBe("2024-01-10T10:00:00.000Z");
  });

  it("handles 0 hours (now)", () => {
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
    expect(getDateNHoursAgo(0)).toBe("2024-01-10T12:00:00.000Z");
  });
});

describe("handleActionError", () => {
  it("returns the message of an Error instance", () => {
    expect(handleActionError(new Error("boom"))).toBe("boom");
    expect(handleActionError(new TypeError("type error"))).toBe("type error");
  });

  it("returns the default fallback for non-Error values", () => {
    expect(handleActionError("oops")).toBe("Action failed");
  });

  it("returns a custom fallback for non-Error values", () => {
    expect(handleActionError(null, "custom fallback")).toBe("custom fallback");
  });
});

describe("withRetry", () => {
  const opts = { retries: 2, baseDelay: 0 };

  it("returns the result without retrying on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, opts)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries and resolves once the function succeeds", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("transient")).mockResolvedValue("recovered");
    await expect(withRetry(fn, opts)).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws the last error after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    await expect(withRetry(fn, opts)).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("stops retrying when abortOn matches the error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("401 unauthorized"));
    await expect(withRetry(fn, { ...opts, abortOn: /401/ })).rejects.toThrow("401 unauthorized");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("invokes onError for every failed attempt", async () => {
    const onError = vi.fn();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(withRetry(fn, { ...opts, onError })).rejects.toThrow("fail");
    expect(onError).toHaveBeenCalledTimes(3);
  });

  it("handles zero retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("no retry"));
    await expect(withRetry(fn, { retries: 0, baseDelay: 0 })).rejects.toThrow("no retry");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
