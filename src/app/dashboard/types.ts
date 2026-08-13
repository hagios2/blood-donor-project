export type PublicProfile = {
  id: string;
  name: string;
  region: string;
  role: "donor" | "hospital";
};

export type BloodRequestRow = {
  id: string;
  hospital_id: string;
  blood_type: string;
  units_needed: number;
  units_fulfilled: number;
  urgency: string;
  region: string;
  status: "open" | "fulfilled" | "cancelled";
  created_at: string;
};

export type ResponseRow = {
  id: string;
  request_id: string;
  responder_type: "donor" | "hospital";
  responder_id: string;
  units_offered: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
};

export type StockRow = {
  id: string;
  hospital_id: string;
  blood_type: string;
  units_available: number;
};
