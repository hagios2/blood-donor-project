"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BLOOD_TYPES, GHANA_REGIONS } from "@/lib/constants";
import { sendSms } from "@/lib/sms";

export type ActionState = { error: string | null };

export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const region = String(formData.get("region") || "");

  if (!email || !password || !name || !region) {
    return { error: "Please fill in all required fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "donor" && role !== "hospital") {
    return { error: "Please select a role." };
  }
  if (!(GHANA_REGIONS as readonly string[]).includes(region)) {
    return { error: "Please select a valid region." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  const user = data.user;
  if (!user) return { error: "Sign up failed — please try again." };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    email,
    role,
    name,
    phone: phone || null,
    region,
  });
  if (profileError) return { error: `Profile creation failed: ${profileError.message}` };

  let welcomeMessage = `Welcome to BloodLink, ${name}! You're registered as a ${role}. We'll text you when there's an urgent match near you.`;

  if (role === "donor") {
    const bloodType = String(formData.get("blood_type") || "");
    if (!(BLOOD_TYPES as readonly string[]).includes(bloodType)) {
      return { error: "Please select a valid blood type." };
    }
    const { error: donorError } = await supabase.from("donor_profiles").insert({
      user_id: user.id,
      blood_type: bloodType,
      last_donation_date: null,
    });
    if (donorError) return { error: `Donor profile failed: ${donorError.message}` };

    const { data: matches } = await supabase
      .from("blood_requests")
      .select("id")
      .eq("status", "open")
      .eq("region", region)
      .eq("blood_type", bloodType);
    if (matches && matches.length > 0) {
      welcomeMessage =
        matches.length === 1
          ? `Welcome to BloodLink, ${name}! There's already 1 open request for ${bloodType} blood in your region. Log in to see it.`
          : `Welcome to BloodLink, ${name}! There are already ${matches.length} open requests for ${bloodType} blood in your region. Log in to see them.`;
    }
  } else {
    const address = String(formData.get("address") || "").trim();
    if (!address) return { error: "Please enter the hospital address." };
    const { error: hospitalError } = await supabase.from("hospitals").insert({
      user_id: user.id,
      address,
    });
    if (hospitalError) return { error: `Hospital profile failed: ${hospitalError.message}` };
  }

  await sendSms(phone, welcomeMessage);

  redirect("/dashboard");
}
