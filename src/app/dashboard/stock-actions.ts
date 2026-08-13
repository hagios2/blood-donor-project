"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BLOOD_TYPES } from "@/lib/constants";
import { sendSms } from "@/lib/sms";

export type ActionState = { error: string | null };

export async function upsertStock(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const bloodType = String(formData.get("blood_type") || "");
  const units = Number(formData.get("units_available"));

  if (!(BLOOD_TYPES as readonly string[]).includes(bloodType)) {
    return { error: "Please select a valid blood type." };
  }
  if (!Number.isFinite(units) || units < 0) {
    return { error: "Units must be zero or a positive number." };
  }

  const { error } = await supabase
    .from("hospital_stock")
    .upsert(
      { hospital_id: user.id, blood_type: bloodType, units_available: units },
      { onConflict: "hospital_id,blood_type" },
    );
  if (error) return { error: error.message };

  if (units > 0) {
    notifyOfExistingMatchingRequests(supabase, user.id, bloodType);
  }

  revalidatePath("/dashboard");
  return { error: null };
}

async function notifyOfExistingMatchingRequests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hospitalId: string,
  bloodType: string,
) {
  const { data: self } = await supabase
    .from("profiles")
    .select("phone, region")
    .eq("id", hospitalId)
    .single();
  if (!self) return;

  const { data: matches } = await supabase
    .from("blood_requests")
    .select("id")
    .eq("status", "open")
    .eq("region", self.region)
    .eq("blood_type", bloodType)
    .neq("hospital_id", hospitalId);
  if (!matches || matches.length === 0) return;

  const message =
    matches.length === 1
      ? `BloodLink: 1 hospital in your region needs ${bloodType} blood, matching stock you just added. Log in to help.`
      : `BloodLink: ${matches.length} hospitals in your region need ${bloodType} blood, matching stock you just added. Log in to help.`;
  await sendSms(self.phone, message);
}
