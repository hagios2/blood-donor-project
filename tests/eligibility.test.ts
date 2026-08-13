import { describe, it, expect } from "vitest";
import { isDonorEligible, nextEligibleDate, DONOR_ELIGIBILITY_DAYS } from "@/lib/constants";

describe("isDonorEligible", () => {
  it("is eligible when there is no prior donation", () => {
    expect(isDonorEligible(null)).toBe(true);
  });

  it("is not eligible the day after donating", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isDonorEligible(yesterday.toISOString().slice(0, 10))).toBe(false);
  });

  it("is not eligible one day before the 56-day window closes", () => {
    const almostReady = new Date();
    almostReady.setDate(almostReady.getDate() - (DONOR_ELIGIBILITY_DAYS - 1));
    expect(isDonorEligible(almostReady.toISOString().slice(0, 10))).toBe(false);
  });

  it("is eligible exactly on the 56th day", () => {
    const readyToday = new Date();
    readyToday.setDate(readyToday.getDate() - DONOR_ELIGIBILITY_DAYS);
    expect(isDonorEligible(readyToday.toISOString().slice(0, 10))).toBe(true);
  });

  it("is eligible well past the 56-day window", () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 200);
    expect(isDonorEligible(longAgo.toISOString().slice(0, 10))).toBe(true);
  });
});

describe("nextEligibleDate", () => {
  it("returns null when there is no prior donation", () => {
    expect(nextEligibleDate(null)).toBeNull();
  });

  it("returns exactly 56 days after the last donation", () => {
    const last = new Date("2026-01-01");
    const next = nextEligibleDate("2026-01-01");
    const expected = new Date(last);
    expected.setDate(expected.getDate() + DONOR_ELIGIBILITY_DAYS);
    expect(next?.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10));
  });
});
