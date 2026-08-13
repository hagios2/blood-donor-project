"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/sms";

export type ActionState = { error: string | null };

export async function respondToRequest(
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
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found." };

  const requestId = String(formData.get("request_id") || "");
  const unitsOffered =
    profile.role === "donor" ? 1 : Number(formData.get("units_offered"));

  if (!Number.isInteger(unitsOffered) || unitsOffered < 1) {
    return { error: "Units offered must be a positive whole number." };
  }

  const { error } = await supabase.from("responses").insert({
    request_id: requestId,
    responder_type: profile.role,
    responder_id: user.id,
    units_offered: unitsOffered,
    status: "pending",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

export async function acceptResponse(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const responseId = String(formData.get("response_id") || "");

  const { error } = await supabase.rpc("accept_response", {
    p_response_id: responseId,
  });
  if (error) return { error: error.message };

  notifyResponderAccepted(supabase, responseId);

  revalidatePath("/dashboard");
  return { error: null };
}

type ResponseNotificationInfo = {
  responder_phone: string | null;
  responder_name: string;
  responder_type: "donor" | "hospital";
  hospital_name: string;
  blood_type: string;
  units_offered: number;
};

async function notifyResponderAccepted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  responseId: string,
) {
  const { data } = await supabase
    .rpc("get_response_notification_info", { p_response_id: responseId })
    .single<ResponseNotificationInfo>();
  if (!data) return;

  const message = `BloodLink: Thank you! Your offer of ${data.units_offered} unit(s) of ${data.blood_type} to ${data.hospital_name} has been accepted.`;
  await sendSms(data.responder_phone, message);
}

export async function rejectResponse(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const responseId = String(formData.get("response_id") || "");

  const { error } = await supabase.rpc("reject_response", {
    p_response_id: responseId,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}
