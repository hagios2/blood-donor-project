export const BLOOD_TYPES = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
  "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Western North", "Oti", "North East", "Savannah",
] as const;
export type Region = (typeof GHANA_REGIONS)[number];

export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const DONOR_ELIGIBILITY_DAYS = 56;

export function isDonorEligible(lastDonationDate: string | null): boolean {
  if (!lastDonationDate) return true;
  const last = new Date(lastDonationDate);
  const next = new Date(last);
  next.setDate(next.getDate() + DONOR_ELIGIBILITY_DAYS);
  return new Date() >= next;
}

export function nextEligibleDate(lastDonationDate: string | null): Date | null {
  if (!lastDonationDate) return null;
  const last = new Date(lastDonationDate);
  const next = new Date(last);
  next.setDate(next.getDate() + DONOR_ELIGIBILITY_DAYS);
  return next;
}
