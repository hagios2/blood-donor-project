import { describe, it, expect } from "vitest";
import {
  signUpDonor,
  signUpHospital,
  setStock,
  createRequest,
  submitResponse,
} from "./helpers";

// Integration tests against the real Supabase project (see helpers.ts for
// why: no local Postgres/staging environment exists yet). Each test creates
// its own fresh, uniquely-named actors so tests don't interfere with each
// other or with manually-created demo accounts.

describe("accept_response (Postgres RPC)", () => {
  it("supports partial fulfillment from a donor + a hospital and auto-closes exactly at the threshold", async () => {
    const region = "Ashanti";
    const requester = await signUpHospital({ region });
    const supplier = await signUpHospital({ region });
    const donor = await signUpDonor({ bloodType: "B+", region, lastDonationDate: null });

    await setStock(supplier.client, supplier.userId, "B+", 5);

    const request = await createRequest(requester.client, requester.userId, "B+", 2, region);

    const donorResponse = await submitResponse(donor.client, request.id, "donor", donor.userId, 1);
    const hospitalResponse = await submitResponse(
      supplier.client,
      request.id,
      "hospital",
      supplier.userId,
      1,
    );

    const { data: afterFirst, error: firstError } = await requester.client.rpc(
      "accept_response",
      { p_response_id: donorResponse.id },
    );
    expect(firstError).toBeNull();
    expect(afterFirst.units_fulfilled).toBe(1);
    expect(afterFirst.status).toBe("open");

    const { data: afterSecond, error: secondError } = await requester.client.rpc(
      "accept_response",
      { p_response_id: hospitalResponse.id },
    );
    expect(secondError).toBeNull();
    expect(afterSecond.units_fulfilled).toBe(2);
    expect(afterSecond.status).toBe("fulfilled");

    const { data: donorProfile } = await donor.client
      .from("donor_profiles")
      .select("last_donation_date")
      .eq("user_id", donor.userId)
      .single();
    expect(donorProfile?.last_donation_date).toBe(new Date().toISOString().slice(0, 10));

    const { data: supplierStock } = await supplier.client
      .from("hospital_stock")
      .select("units_available")
      .eq("hospital_id", supplier.userId)
      .eq("blood_type", "B+")
      .single();
    expect(supplierStock?.units_available).toBe(4);
  });

  it("rejects accepting a response once the request is already fulfilled", async () => {
    const region = "Western";
    const requester = await signUpHospital({ region });
    const donorA = await signUpDonor({ bloodType: "O-", region, lastDonationDate: null });
    const donorB = await signUpDonor({ bloodType: "O-", region, lastDonationDate: null });

    const request = await createRequest(requester.client, requester.userId, "O-", 1, region);

    const responseA = await submitResponse(donorA.client, request.id, "donor", donorA.userId, 1);
    const responseB = await submitResponse(donorB.client, request.id, "donor", donorB.userId, 1);

    const { error: firstError } = await requester.client.rpc("accept_response", {
      p_response_id: responseA.id,
    });
    expect(firstError).toBeNull();

    const { error: secondError } = await requester.client.rpc("accept_response", {
      p_response_id: responseB.id,
    });
    expect(secondError).not.toBeNull();
    expect(secondError?.message).toMatch(/not open|not pending/i);
  });

  it("rejects a hospital response when the offer exceeds current stock at accept time", async () => {
    const region = "Central";
    const requester = await signUpHospital({ region });
    const supplier = await signUpHospital({ region });

    await setStock(supplier.client, supplier.userId, "AB+", 3);
    const request = await createRequest(requester.client, requester.userId, "AB+", 3, region);
    const response = await submitResponse(
      supplier.client,
      request.id,
      "hospital",
      supplier.userId,
      3,
    );

    // Stock drops below the offered amount after the offer was made but
    // before it's accepted -- the RPC must re-check at accept time.
    await setStock(supplier.client, supplier.userId, "AB+", 1);

    const { error } = await requester.client.rpc("accept_response", {
      p_response_id: response.id,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/stock/i);
  });

  it("only the requesting hospital may accept a response to its own request", async () => {
    const region = "Volta";
    const requester = await signUpHospital({ region });
    const impostor = await signUpHospital({ region });
    const donor = await signUpDonor({ bloodType: "A-", region, lastDonationDate: null });

    const request = await createRequest(requester.client, requester.userId, "A-", 1, region);
    const response = await submitResponse(donor.client, request.id, "donor", donor.userId, 1);

    const { error } = await impostor.client.rpc("accept_response", {
      p_response_id: response.id,
    });
    expect(error).not.toBeNull();
  });
});
