import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GHANA_REGIONS, type BloodType } from "@/lib/constants";

// These integration tests run against the real (dev) Supabase project via
// ephemeral, uniquely-named accounts, since the project currently has no
// local Postgres or staging environment (documented as technical debt).
// Accounts are tagged "vitest-" so they're identifiable for manual cleanup.

export function freshClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function uniqueEmail(prefix: string): string {
  return `vitest-${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@yahoo.com`;
}

export async function signUpDonor(opts: {
  bloodType: BloodType;
  region?: string;
  lastDonationDate?: string | null;
  phone?: string | null;
}) {
  const client = freshClient();
  const email = uniqueEmail("donor");
  const region = opts.region ?? GHANA_REGIONS[0];

  const { data, error } = await client.auth.signUp({ email, password: "vitestpass123" });
  if (error || !data.user) throw new Error(`signUp failed: ${error?.message}`);
  const userId = data.user.id;

  const { error: profileError } = await client.from("profiles").insert({
    id: userId,
    email,
    role: "donor",
    name: `Vitest Donor ${userId.slice(0, 6)}`,
    phone: opts.phone ?? null,
    region,
  });
  if (profileError) throw new Error(`profile insert failed: ${profileError.message}`);

  const { error: donorError } = await client.from("donor_profiles").insert({
    user_id: userId,
    blood_type: opts.bloodType,
    last_donation_date: opts.lastDonationDate ?? null,
  });
  if (donorError) throw new Error(`donor_profiles insert failed: ${donorError.message}`);

  return { client, userId, email, region };
}

export async function signUpHospital(opts: { region?: string; phone?: string | null }) {
  const client = freshClient();
  const email = uniqueEmail("hospital");
  const region = opts.region ?? GHANA_REGIONS[0];

  const { data, error } = await client.auth.signUp({ email, password: "vitestpass123" });
  if (error || !data.user) throw new Error(`signUp failed: ${error?.message}`);
  const userId = data.user.id;

  const { error: profileError } = await client.from("profiles").insert({
    id: userId,
    email,
    role: "hospital",
    name: `Vitest Hospital ${userId.slice(0, 6)}`,
    phone: opts.phone ?? null,
    region,
  });
  if (profileError) throw new Error(`profile insert failed: ${profileError.message}`);

  const { error: hospitalError } = await client.from("hospitals").insert({
    user_id: userId,
    address: "1 Vitest Ave",
  });
  if (hospitalError) throw new Error(`hospitals insert failed: ${hospitalError.message}`);

  return { client, userId, email, region };
}

export async function setStock(
  client: SupabaseClient,
  hospitalId: string,
  bloodType: BloodType,
  units: number,
) {
  const { error } = await client
    .from("hospital_stock")
    .upsert(
      { hospital_id: hospitalId, blood_type: bloodType, units_available: units },
      { onConflict: "hospital_id,blood_type" },
    );
  if (error) throw new Error(`setStock failed: ${error.message}`);
}

export async function createRequest(
  client: SupabaseClient,
  hospitalId: string,
  bloodType: BloodType,
  unitsNeeded: number,
  region: string,
) {
  const { data, error } = await client
    .from("blood_requests")
    .insert({
      hospital_id: hospitalId,
      blood_type: bloodType,
      units_needed: unitsNeeded,
      urgency: "high",
      region,
      status: "open",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`createRequest failed: ${error?.message}`);
  return data;
}

export async function submitResponse(
  client: SupabaseClient,
  requestId: string,
  responderType: "donor" | "hospital",
  responderId: string,
  unitsOffered: number,
) {
  const { data, error } = await client
    .from("responses")
    .insert({
      request_id: requestId,
      responder_type: responderType,
      responder_id: responderId,
      units_offered: unitsOffered,
      status: "pending",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`submitResponse failed: ${error?.message}`);
  return data;
}
