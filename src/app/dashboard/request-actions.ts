"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BLOOD_TYPES, URGENCY_LEVELS } from "@/lib/constants";
import { sendSms } from "@/lib/sms";

export type ActionState = { error: string | null };

export async function createRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("region")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Hospital profile not found." };

  const bloodType = String(formData.get("blood_type") || "");
  const unitsNeeded = Number(formData.get("units_needed"));
  const urgency = String(formData.get("urgency") || "");

  if (!(BLOOD_TYPES as readonly string[]).includes(bloodType)) {
    return { error: "Please select a valid blood type." };
  }
  if (!Number.isInteger(unitsNeeded) || unitsNeeded < 1) {
    return { error: "Units needed must be a positive whole number." };
  }
  if (!(URGENCY_LEVELS as readonly string[]).includes(urgency)) {
    return { error: "Please select an urgency level." };
  }

  const { data: request, error } = await supabase
    .from("blood_requests")
    .insert({
      hospital_id: user.id,
      blood_type: bloodType,
      units_needed: unitsNeeded,
      urgency,
      region: profile.region,
      status: "open",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  notifyMatchingTargets(supabase, request.id, bloodType, unitsNeeded, urgency);

  revalidatePath("/dashboard");
  return { error: null };
}

type NotificationTarget = { phone: string; name: string; kind: "donor" | "hospital" };

async function notifyMatchingTargets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestId: string,
  bloodType: string,
  unitsNeeded: number,
  urgency: string,
) {
  const { data: targets } = await supabase.rpc("get_notification_targets", {
    p_request_id: requestId,
  });
  const message = `BloodLink: URGENT need for ${unitsNeeded} unit(s) of ${bloodType} blood (${urgency}). Please log in to BloodLink to respond if you can help.`;
  await Promise.all(
    ((targets ?? []) as NotificationTarget[]).map((t) => sendSms(t.phone, message)),
  );
}

export async function cancelRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const requestId = String(formData.get("request_id") || "");
  const { error } = await supabase
    .from("blood_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("hospital_id", user.id)
    .eq("status", "open");
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}
