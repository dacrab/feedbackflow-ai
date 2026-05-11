import { describe, expect, it, vi } from "vitest";
import { cn, formatDateUTC, getDateNHoursAgo } from "./utils";

describe("cn", () => {
  it("merges classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditionals", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("formatDateUTC", () => {
  it("formats known ISO string correctly", () => {
    const result = formatDateUTC("2024-06-15T14:30:00.000Z");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2024");
    expect(result).toContain("02:30");
  });
});

describe("getDateNHoursAgo", () => {
  it("returns ISO string approximately N hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));

    const result = getDateNHoursAgo(2);
    expect(result).toBe("2024-01-10T10:00:00.000Z");

    vi.useRealTimers();
  });
});
