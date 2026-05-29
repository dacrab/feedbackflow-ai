import { afterEach, describe, expect, it, vi } from "vitest";
import { cn, formatDateUTC, getDateNHoursAgo } from "./utils";

describe("cn", () => {
  it("merges classes", () => expect(cn("foo", "bar")).toBe("foo bar"));
  it("drops falsy values", () => expect(cn("foo", false && "bar", "baz")).toBe("foo baz"));
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
