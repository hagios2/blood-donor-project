import { describe, it, expect } from "vitest";
import { signUpDonor, signUpHospital, setStock, createRequest } from "./helpers";

type Target = { phone: string; name: string; kind: "donor" | "hospital" };

describe("get_notification_targets (Postgres RPC)", () => {
  it("includes an eligible matching donor and a matching in-stock hospital, and excludes the requester itself", async () => {
    const region = "Eastern";
    const requester = await signUpHospital({ region, phone: "0240000001" });
    const matchingDonor = await signUpDonor({
      bloodType: "AB-",
      region,
      lastDonationDate: null,
      phone: "0240000002",
    });
    const matchingSupplier = await signUpHospital({ region, phone: "0240000003" });
    await setStock(matchingSupplier.client, matchingSupplier.userId, "AB-", 2);

    const request = await createRequest(requester.client, requester.userId, "AB-", 1, region);

    const { data, error } = await requester.client.rpc("get_notification_targets", {
      p_request_id: request.id,
    });
    expect(error).toBeNull();
    const targets = (data ?? []) as Target[];

    const donorPhones = targets.filter((t) => t.kind === "donor").map((t) => t.phone);
    expect(donorPhones).toContain("0240000002");
    expect(targets.find((t) => t.phone === "0240000002")?.name).toBe(
      `Vitest Donor ${matchingDonor.userId.slice(0, 6)}`,
    );
    const hospitalPhones = targets.filter((t) => t.kind === "hospital").map((t) => t.phone);
    expect(hospitalPhones).toContain("0240000003");
    expect(hospitalPhones).not.toContain("0240000001");
  });

  it("excludes a donor who is not yet eligible (donated recently)", async () => {
    const region = "Bono";
    const requester = await signUpHospital({ region, phone: "0241000001" });
    const recent = new Date();
    recent.setDate(recent.getDate() - 5);
    await signUpDonor({
      bloodType: "B-",
      region,
      lastDonationDate: recent.toISOString().slice(0, 10),
      phone: "0241000002",
    });

    const request = await createRequest(requester.client, requester.userId, "B-", 1, region);
    const { data, error } = await requester.client.rpc("get_notification_targets", {
      p_request_id: request.id,
    });
    expect(error).toBeNull();
    const targets = (data ?? []) as Target[];
    expect(targets.some((t) => t.phone === "0241000002")).toBe(false);
  });

  it("excludes donors and hospitals in a different region", async () => {
    const region = "Northern";
    const otherRegion = "Upper East";
    const requester = await signUpHospital({ region, phone: "0242000001" });
    await signUpDonor({
      bloodType: "O+",
      region: otherRegion,
      lastDonationDate: null,
      phone: "0242000002",
    });
    const farSupplier = await signUpHospital({ region: otherRegion, phone: "0242000003" });
    await setStock(farSupplier.client, farSupplier.userId, "O+", 5);

    const request = await createRequest(requester.client, requester.userId, "O+", 1, region);
    const { data, error } = await requester.client.rpc("get_notification_targets", {
      p_request_id: request.id,
    });
    expect(error).toBeNull();
    const targets = (data ?? []) as Target[];
    expect(targets.map((t) => t.phone)).not.toContain("0242000002");
    expect(targets.map((t) => t.phone)).not.toContain("0242000003");
  });

  it("excludes a hospital with zero stock of the matching type", async () => {
    const region = "Ahafo";
    const requester = await signUpHospital({ region, phone: "0243000001" });
    const emptySupplier = await signUpHospital({ region, phone: "0243000002" });
    await setStock(emptySupplier.client, emptySupplier.userId, "A+", 0);

    const request = await createRequest(requester.client, requester.userId, "A+", 1, region);
    const { data, error } = await requester.client.rpc("get_notification_targets", {
      p_request_id: request.id,
    });
    expect(error).toBeNull();
    const targets = (data ?? []) as Target[];
    expect(targets.map((t) => t.phone)).not.toContain("0243000002");
  });

  it("can only be called by the hospital that owns the request", async () => {
    const region = "Savannah";
    const requester = await signUpHospital({ region, phone: "0244000001" });
    const outsider = await signUpHospital({ region, phone: "0244000002" });

    const request = await createRequest(requester.client, requester.userId, "A+", 1, region);
    const { error } = await outsider.client.rpc("get_notification_targets", {
      p_request_id: request.id,
    });
    expect(error).not.toBeNull();
  });
});
