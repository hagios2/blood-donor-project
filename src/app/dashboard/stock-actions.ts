"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BLOOD_TYPES } from "@/lib/constants";

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

  revalidatePath("/dashboard");
  return { error: null };
}
