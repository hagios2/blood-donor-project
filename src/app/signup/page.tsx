"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { BLOOD_TYPES, GHANA_REGIONS } from "@/lib/constants";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null });
  const [role, setRole] = useState<"donor" | "hospital">("donor");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-red-700">Create your BloodLink account</h1>
      <p className="mt-1 text-sm text-gray-600">
        Register as a donor or a hospital to start matching urgent blood requests.
      </p>

      <div className="mt-6 flex rounded-lg border border-gray-300 p-1">
        <button
          type="button"
          onClick={() => setRole("donor")}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            role === "donor" ? "bg-red-600 text-white" : "text-gray-600"
          }`}
        >
          I&apos;m a Donor
        </button>
        <button
          type="button"
          onClick={() => setRole("hospital")}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            role === "hospital" ? "bg-red-600 text-white" : "text-gray-600"
          }`}
        >
          I&apos;m a Hospital
        </button>
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />

        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required minLength={8} />
        <Field
          label={role === "donor" ? "Full name" : "Hospital name"}
          name="name"
          type="text"
          required
        />
        <Field label="Phone" name="phone" type="tel" />

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Region
          <select name="region" required className="rounded-md border border-gray-300 px-3 py-2">
            <option value="">Select a region</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        {role === "donor" ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Blood type
            <select name="blood_type" required className="rounded-md border border-gray-300 px-3 py-2">
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
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-red-600 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-red-700 underline">
          Log in
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="rounded-md border border-gray-300 px-3 py-2 font-normal"
      />
    </label>
  );
}
