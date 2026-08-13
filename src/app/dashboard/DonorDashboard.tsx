"use client";

import { useActionState } from "react";
import { respondToRequest } from "./response-actions";
import { isDonorEligible, nextEligibleDate } from "@/lib/constants";
import type { BloodRequestRow, PublicProfile, ResponseRow } from "./types";
import { StatusBadge, UrgencyBadge, BloodTypeBadge } from "@/components/Badge";
import { HeartPulse, MapPinned, History, CheckCircle2, Clock } from "lucide-react";

export default function DonorDashboard({
  bloodType,
  lastDonationDate,
  matchingRequests,
  alreadyRespondedIds,
  myResponses,
  myResponseRequests,
  profiles,
}: {
  bloodType: string;
  lastDonationDate: string | null;
  matchingRequests: BloodRequestRow[];
  alreadyRespondedIds: Set<string>;
  myResponses: ResponseRow[];
  myResponseRequests: BloodRequestRow[];
  profiles: PublicProfile[];
}) {
  const [state, formAction, pending] = useActionState(respondToRequest, { error: null });
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const requestById = new Map(myResponseRequests.map((r) => [r.id, r]));

  const eligible = isDonorEligible(lastDonationDate);
  const nextDate = nextEligibleDate(lastDonationDate);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <section className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
          <HeartPulse size={20} />
        </span>
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your donor profile</h2>
          <p className="text-lg font-semibold">Blood type: {bloodType}</p>
          {eligible ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 size={14} /> You are eligible to donate now.
            </p>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400">
              <Clock size={14} /> Not yet eligible — next eligible date:{" "}
              {nextDate?.toLocaleDateString()}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-start gap-2.5">
          <span className="mt-0.5 text-red-600 dark:text-red-400">
            <MapPinned size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Requests near you</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Open requests in your region matching your blood type.
            </p>
          </div>
        </div>
        {matchingRequests.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No matching requests right now.</p>
        )}
        <ul className="flex flex-col gap-3">
          {matchingRequests.map((req) => {
            const requester = profileById.get(req.hospital_id);
            const already = alreadyRespondedIds.has(req.id);
            return (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex items-center gap-2">
                  <BloodTypeBadge bloodType={req.blood_type} />
                  <span>
                    <strong>{requester?.name ?? "A hospital"}</strong> needs{" "}
                    {req.units_needed - req.units_fulfilled} unit(s)
                  </span>
                  <UrgencyBadge urgency={req.urgency} />
                </span>
                {already ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Response sent</span>
                ) : eligible ? (
                  <form action={formAction}>
                    <input type="hidden" name="request_id" value={req.id} />
                    <button
                      type="submit"
                      disabled={pending}
                      className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      I can donate
                    </button>
                  </form>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500">Not yet eligible</span>
                )}
              </li>
            );
          })}
        </ul>
        {state.error && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="text-red-600 dark:text-red-400">
            <History size={20} />
          </span>
          <h2 className="text-lg font-semibold">Your response history</h2>
        </div>
        {myResponses.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No responses yet.</p>
        )}
        <ul className="flex flex-col gap-2">
          {myResponses.map((resp) => {
            const req = requestById.get(resp.request_id);
            const requester = req ? profileById.get(req.hospital_id) : undefined;
            return (
              <li
                key={resp.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm"
              >
                <span>
                  {req?.blood_type ?? "Unknown"} to {requester?.name ?? "a hospital"}
                </span>
                <StatusBadge status={resp.status} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
