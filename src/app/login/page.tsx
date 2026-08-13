"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(logIn, { error: null });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-red-700 dark:text-red-400">Log in to BloodLink</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 font-normal"
          />
        </label>

        {state.error && (
          <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-red-600 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-red-700 dark:text-red-400 underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
