"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/dashboard");
  return { error: null };
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
