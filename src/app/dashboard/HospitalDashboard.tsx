"use client";

import { useActionState } from "react";
import { upsertStock } from "./stock-actions";
import { createRequest, cancelRequest } from "./request-actions";
import {
  respondToRequest,
  acceptResponse,
  rejectResponse,
} from "./response-actions";
import { BLOOD_TYPES, URGENCY_LEVELS } from "@/lib/constants";
import type { BloodRequestRow, PublicProfile, ResponseRow, StockRow } from "./types";

export default function HospitalDashboard({
  region,
  address,
  stock,
  myRequests,
  responsesToMine,
  matchingRequests,
  alreadyRespondedIds,
  stockByType,
  profiles,
}: {
  region: string;
  address: string;
  stock: StockRow[];
  myRequests: BloodRequestRow[];
  responsesToMine: ResponseRow[];
  matchingRequests: BloodRequestRow[];
  alreadyRespondedIds: Set<string>;
  stockByType: Record<string, number>;
  profiles: PublicProfile[];
}) {
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Hospital</h2>
        <p className="text-lg font-semibold">
          {address} <span className="text-gray-400 dark:text-gray-500">· {region}</span>
        </p>
      </section>

      <StockSection stock={stock} />

      <CreateRequestSection />

      <MyRequestsSection
        myRequests={myRequests}
        responsesToMine={responsesToMine}
        profileById={profileById}
      />

      <MatchingRequestsSection
        matchingRequests={matchingRequests}
        alreadyRespondedIds={alreadyRespondedIds}
        stockByType={stockByType}
        profileById={profileById}
      />
    </div>
  );
}

function StockSection({ stock }: { stock: StockRow[] }) {
  const [state, formAction, pending] = useActionState(upsertStock, { error: null });
  const stockByType = new Map(stock.map((s) => [s.blood_type, s.units_available]));

  return (
    <section>
      <h2 className="text-lg font-semibold">Your blood stock</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Update available units per type. Setting units to 0 hides that type from other
        hospitals&apos; matching feed.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Blood type
          <select name="blood_type" required className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            {BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Units available
          <input
            name="units_available"
            type="number"
            min={0}
            required
            className="w-32 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>}

      <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {BLOOD_TYPES.map((t) => (
          <li
            key={t}
            className="rounded-md border border-gray-200 dark:border-gray-800 px-2 py-2 text-center text-sm"
          >
            <div className="font-semibold">{t}</div>
            <div className="text-gray-500 dark:text-gray-400">{stockByType.get(t) ?? 0}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreateRequestSection() {
  const [state, formAction, pending] = useActionState(createRequest, { error: null });

  return (
    <section>
      <h2 className="text-lg font-semibold">Create a blood request</h2>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Blood type
          <select name="blood_type" required className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            {BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Units needed
          <input
            name="units_needed"
            type="number"
            min={1}
            required
            className="w-32 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Urgency
          <select name="urgency" required className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            {URGENCY_LEVELS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post request"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </section>
  );
}

function MyRequestsSection({
  myRequests,
  responsesToMine,
  profileById,
}: {
  myRequests: BloodRequestRow[];
  responsesToMine: ResponseRow[];
  profileById: Map<string, PublicProfile>;
}) {
  const [cancelState, cancelAction] = useActionState(cancelRequest, { error: null });
  const [acceptState, acceptAction] = useActionState(acceptResponse, { error: null });
  const [rejectState, rejectAction] = useActionState(rejectResponse, { error: null });

  return (
    <section>
      <h2 className="text-lg font-semibold">Your requests</h2>
      {myRequests.length === 0 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No requests posted yet.</p>
      )}
      <ul className="mt-4 flex flex-col gap-4">
        {myRequests.map((req) => {
          const responses = responsesToMine.filter((r) => r.request_id === req.id);
          const pending = responses.filter((r) => r.status === "pending");
          return (
            <li key={req.id} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{req.blood_type}</span>{" "}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {req.units_fulfilled}/{req.units_needed} units · {req.urgency} · {req.status}
                  </span>
                </div>
                {req.status === "open" && (
                  <form action={cancelAction}>
                    <input type="hidden" name="request_id" value={req.id} />
                    <button className="text-sm text-gray-500 dark:text-gray-400 underline">Cancel</button>
                  </form>
                )}
              </div>

              {pending.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {pending.map((resp) => {
                    const who = profileById.get(resp.responder_id);
                    return (
                      <li
                        key={resp.id}
                        className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm"
                      >
                        <span>
                          {resp.responder_type === "donor" ? "Donor" : "Hospital"}{" "}
                          <strong>{who?.name ?? "Unknown"}</strong> offers{" "}
                          {resp.units_offered} unit(s)
                        </span>
                        <span className="flex gap-2">
                          <form action={acceptAction}>
                            <input type="hidden" name="response_id" value={resp.id} />
                            <button className="rounded-md bg-red-600 px-2 py-1 text-white">
                              Accept
                            </button>
                          </form>
                          <form action={rejectAction}>
                            <input type="hidden" name="response_id" value={resp.id} />
                            <button className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1">
                              Reject
                            </button>
                          </form>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      {(cancelState.error || acceptState.error || rejectState.error) && (
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          {cancelState.error || acceptState.error || rejectState.error}
        </p>
      )}
    </section>
  );
}

function MatchingRequestsSection({
  matchingRequests,
  alreadyRespondedIds,
  stockByType,
  profileById,
}: {
  matchingRequests: BloodRequestRow[];
  alreadyRespondedIds: Set<string>;
  stockByType: Record<string, number>;
  profileById: Map<string, PublicProfile>;
}) {
  const [state, formAction, pending] = useActionState(respondToRequest, { error: null });

  return (
    <section>
      <h2 className="text-lg font-semibold">Nearby hospitals in need</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Open requests in your region matching a blood type you currently have in stock.
      </p>
      {matchingRequests.length === 0 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No matching requests right now.</p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {matchingRequests.map((req) => {
          const requester = profileById.get(req.hospital_id);
          const maxUnits = Math.min(
            stockByType[req.blood_type] ?? 0,
            req.units_needed - req.units_fulfilled,
          );
          const already = alreadyRespondedIds.has(req.id);
          return (
            <li
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
            >
              <span>
                <strong>{requester?.name ?? "A hospital"}</strong> needs{" "}
                {req.units_needed - req.units_fulfilled} unit(s) of{" "}
                <strong>{req.blood_type}</strong> ({req.urgency})
              </span>
              {already ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">Response sent</span>
              ) : (
                <form action={formAction} className="flex items-center gap-2">
                  <input type="hidden" name="request_id" value={req.id} />
                  <input
                    name="units_offered"
                    type="number"
                    min={1}
                    max={maxUnits}
                    defaultValue={Math.min(1, maxUnits)}
                    required
                    className="w-20 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    Offer supply
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
      {state.error && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </section>
  );
}
