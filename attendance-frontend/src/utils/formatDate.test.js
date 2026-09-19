import { describe, it, expect, vi, afterEach } from "vitest";
import { timeAgo, elapsedSince, formatTime } from "./formatDate";

afterEach(() => vi.useRealTimers());

describe("timeAgo", () => {
  it("describes the recent past in the largest sensible unit", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    vi.useFakeTimers().setSystemTime(now);

    expect(timeAgo(new Date(now.getTime() - 5_000))).toBe("just now");
    expect(timeAgo(new Date(now.getTime() - 45_000))).toBe("45s ago");
    expect(timeAgo(new Date(now.getTime() - 5 * 60_000))).toBe("5m ago");
    expect(timeAgo(new Date(now.getTime() - 3 * 3_600_000))).toBe("3h ago");
    expect(timeAgo(new Date(now.getTime() - 2 * 86_400_000))).toBe("2d ago");
  });
});

describe("elapsedSince", () => {
  it("counts up as mm:ss and grows to h:mm:ss", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    vi.useFakeTimers().setSystemTime(now);

    expect(elapsedSince(new Date(now.getTime() - 9_000))).toBe("00:09");
    expect(elapsedSince(new Date(now.getTime() - 125_000))).toBe("02:05");
    expect(elapsedSince(new Date(now.getTime() - 3_725_000))).toBe("1:02:05");
  });

  it("never shows a negative timer when a clock is slightly ahead", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    vi.useFakeTimers().setSystemTime(now);

    expect(elapsedSince(new Date(now.getTime() + 5_000))).toBe("00:00");
  });
});

describe("formatTime", () => {
  it("formats a date without throwing", () => {
    expect(formatTime("2026-01-01T09:05:00Z")).toMatch(/\d/);
  });
});
