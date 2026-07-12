import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cn,
  formatDateUTC,
  getDateNHoursAgo,
  sentimentColor,
  sevColor,
  sevLabel,
  timeAgo,
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
  it("includes year, month abbreviation, and day", () => {
    const result = formatDateUTC("2024-06-15T14:30:00.000Z");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats midnight correctly", () => {
    const result = formatDateUTC("2024-01-01T00:00:00.000Z");
    expect(result).toContain("Jan");
    expect(result).toContain("2024");
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
  afterEach(() => vi.useRealTimers());

  it("returns seconds ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T12:00:30.000Z"));
    expect(timeAgo(new Date("2024-01-10T12:00:00.000Z"))).toBe("30s ago");
  });

  it("returns minutes ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T12:05:00.000Z"));
    expect(timeAgo("2024-01-10T12:00:00.000Z")).toBe("5m ago");
  });

  it("returns hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T15:00:00.000Z"));
    expect(timeAgo("2024-01-10T12:00:00.000Z")).toBe("3h ago");
  });

  it("returns days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
    expect(timeAgo("2024-01-10T12:00:00.000Z")).toBe("5d ago");
  });
});

describe("getDateNHoursAgo", () => {
  afterEach(() => vi.useRealTimers());

  it("returns ISO string exactly N hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
    expect(getDateNHoursAgo(2)).toBe("2024-01-10T10:00:00.000Z");
  });

  it("handles 0 hours (now)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
    expect(getDateNHoursAgo(0)).toBe("2024-01-10T12:00:00.000Z");
  });
});
