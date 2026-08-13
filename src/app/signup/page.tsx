"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { BLOOD_TYPES, GHANA_REGIONS } from "@/lib/constants";
import AuthShell from "@/components/AuthShell";
import { HeartHandshake, Building2, UserPlus } from "lucide-react";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null });
  const [role, setRole] = useState<"donor" | "hospital">("donor");

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Register as a donor or a hospital to start matching urgent blood requests.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("donor")}
          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
            role === "donor"
              ? "border-red-600 bg-red-600 text-white shadow-sm"
              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
        >
          <HeartHandshake size={16} />
          Donor
        </button>
        <button
          type="button"
          onClick={() => setRole("hospital")}
          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
            role === "hospital"
              ? "border-red-600 bg-red-600 text-white shadow-sm"
              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
        >
          <Building2 size={16} />
          Hospital
        </button>
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />

        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Field
          label={role === "donor" ? "Full name" : "Hospital name"}
          name="name"
          type="text"
          autoComplete="name"
          required
        />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Region
          <select name="region" required className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 shadow-sm">
            <option value="">Select a region</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        {role === "donor" ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Blood type
            <select name="blood_type" required className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 shadow-sm">
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        ) : (
          <Field label="Hospital address" name="address" type="text" required />
        )}

        {state.error && (
          <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus size={16} />
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-red-700 dark:text-red-400 underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 font-normal shadow-sm"
      />
    </label>
  );
}
