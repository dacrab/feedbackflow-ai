// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cn,
  formatDateUTC,
  formatShortDate,
  handleActionError,
  hoursAgo,
  sentimentColor,
  sevColor,
  sevLabel,
  timeAgo,
  withRetry,
} from "./utils";

describe("cn", () => {
  it("merges classes", () => expect(cn("foo", "bar")).toBe("foo bar"));
  it("drops falsy values", () => expect(cn("foo", false, "baz")).toBe("foo baz"));
  it("drops 0", () => expect(cn("foo", 0, "bar")).toBe("foo bar"));
  it("drops null and undefined", () => expect(cn("a", null, undefined, "b")).toBe("a b"));
  it("returns empty string for all falsy", () => expect(cn(false, null, undefined, 0)).toBe(""));
  it("last Tailwind class wins", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-danger", "text-blue-500")).toBe("text-blue-500");
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
    [5, "text-danger"],
    [4, "text-danger"],
    [3, "text-warn"],
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
    ["positive", "text-good"],
    ["neutral", "text-muted-foreground"],
    ["negative", "text-danger"],
  ] as const)("returns %s for %s", (sentiment, expected) => {
    expect(sentimentColor(sentiment)).toBe(expected);
  });
});

describe("formatShortDate", () => {
  it("keeps month and day only", () => {
    expect(formatShortDate("2024-06-15")).toBe("06-15");
    expect(formatShortDate("2024-12-01")).toBe("12-01");
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

describe("hoursAgo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns a Date exactly N hours ago", () => {
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
    expect(hoursAgo(2).toISOString()).toBe("2024-01-10T10:00:00.000Z");
  });

  it("handles 0 hours (now)", () => {
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
    expect(hoursAgo(0).toISOString()).toBe("2024-01-10T12:00:00.000Z");
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

  it("returns the fallback for React's production redaction string", () => {
    const redacted = new Error(
      "An error occurred in the Server Components render. The specific message is omitted in production builds.",
    );
    expect(handleActionError(redacted, "too many requests")).toBe("too many requests");
    expect(handleActionError(redacted)).toBe("Action failed");
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

  it("handles zero retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("no retry"));
    await expect(withRetry(fn, { retries: 0, baseDelay: 0 })).rejects.toThrow("no retry");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("still attempts once with a negative retry budget", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("bad budget"));
    await expect(withRetry(fn, { retries: -1, baseDelay: 0 })).rejects.toThrow("bad budget");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops retrying once the signal is aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const fn = vi.fn().mockRejectedValue(new Error("cancelled"));
    await expect(withRetry(fn, { ...opts, signal: ctrl.signal })).rejects.toThrow("cancelled");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
