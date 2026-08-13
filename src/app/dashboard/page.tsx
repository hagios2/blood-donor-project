import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HospitalDashboard from "./HospitalDashboard";
import DonorDashboard from "./DonorDashboard";
import type {
  BloodRequestRow,
  PublicProfile,
  ResponseRow,
  StockRow,
} from "./types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, region, phone, role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  if (profile.role === "hospital") {
    const { data: hospital } = await supabase
      .from("hospitals")
      .select("address")
      .eq("user_id", user.id)
      .single();

    const { data: stock } = await supabase
      .from("hospital_stock")
      .select("*")
      .eq("hospital_id", user.id)
      .order("blood_type");

    const { data: myRequests } = await supabase
      .from("blood_requests")
      .select("*")
      .eq("hospital_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const myRequestIds = (myRequests ?? []).map((r) => r.id);
    const { data: responsesToMine } = myRequestIds.length
      ? await supabase
          .from("responses")
          .select("*")
          .in("request_id", myRequestIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : { data: [] as ResponseRow[] };

    const { data: openElsewhere } = await supabase
      .from("blood_requests")
      .select("*")
      .eq("status", "open")
      .eq("region", profile.region)
      .neq("hospital_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: myHospitalResponses } = await supabase
      .from("responses")
      .select("request_id")
      .eq("responder_id", user.id)
      .eq("responder_type", "hospital");
    const alreadyRespondedIds = new Set(
      (myHospitalResponses ?? []).map((r) => r.request_id),
    );

    const stockByType = new Map(
      (stock ?? []).map((s) => [s.blood_type, s.units_available]),
    );
    const matchingRequests = (openElsewhere ?? []).filter(
      (r) => (stockByType.get(r.blood_type) ?? 0) > 0,
    );

    const responderIds = Array.from(
      new Set((responsesToMine ?? []).map((r) => r.responder_id)),
    );
    const otherHospitalIds = Array.from(
      new Set((matchingRequests ?? []).map((r) => r.hospital_id)),
    );
    const allProfileIds = Array.from(
      new Set([...responderIds, ...otherHospitalIds]),
    );
    const { data: publicProfiles } = allProfileIds.length
      ? await supabase
          .from("profiles_public")
          .select("*")
          .in("id", allProfileIds)
      : { data: [] as PublicProfile[] };

    return (
      <HospitalDashboard
        region={profile.region}
        address={hospital?.address ?? ""}
        stock={(stock ?? []) as StockRow[]}
        myRequests={(myRequests ?? []) as BloodRequestRow[]}
        responsesToMine={(responsesToMine ?? []) as ResponseRow[]}
        matchingRequests={matchingRequests as BloodRequestRow[]}
        alreadyRespondedIds={alreadyRespondedIds}
        stockByType={Object.fromEntries(stockByType)}
        profiles={(publicProfiles ?? []) as PublicProfile[]}
      />
    );
  }

  // Donor
  const { data: donorProfile } = await supabase
    .from("donor_profiles")
    .select("blood_type, last_donation_date")
    .eq("user_id", user.id)
    .single();

  const { data: matchingRequests } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("status", "open")
    .eq("region", profile.region)
    .eq("blood_type", donorProfile?.blood_type ?? "")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: myResponses } = await supabase
    .from("responses")
    .select("*")
    .eq("responder_id", user.id)
    .eq("responder_type", "donor")
    .order("created_at", { ascending: false })
    .limit(20);

  const requesterIds = Array.from(
    new Set((matchingRequests ?? []).map((r) => r.hospital_id)),
  );
  const myResponseRequestIds = Array.from(
    new Set((myResponses ?? []).map((r) => r.request_id)),
  );
  const { data: myResponseRequests } = myResponseRequestIds.length
    ? await supabase
        .from("blood_requests")
        .select("*")
        .in("id", myResponseRequestIds)
    : { data: [] as BloodRequestRow[] };
  const historyRequesterIds = Array.from(
    new Set((myResponseRequests ?? []).map((r) => r.hospital_id)),
  );

  const allIds = Array.from(new Set([...requesterIds, ...historyRequesterIds]));
  const { data: publicProfiles } = allIds.length
    ? await supabase.from("profiles_public").select("*").in("id", allIds)
    : { data: [] as PublicProfile[] };

  const alreadyRespondedIds = new Set(
    (myResponses ?? []).map((r) => r.request_id),
  );

  return (
    <DonorDashboard
      bloodType={donorProfile?.blood_type ?? ""}
      lastDonationDate={donorProfile?.last_donation_date ?? null}
      matchingRequests={(matchingRequests ?? []) as BloodRequestRow[]}
      alreadyRespondedIds={alreadyRespondedIds}
      myResponses={(myResponses ?? []) as ResponseRow[]}
      myResponseRequests={(myResponseRequests ?? []) as BloodRequestRow[]}
      profiles={(publicProfiles ?? []) as PublicProfile[]}
    />
  );
}
