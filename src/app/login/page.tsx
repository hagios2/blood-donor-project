"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logIn } from "./actions";
import AuthShell from "@/components/AuthShell";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(logIn, { error: null });

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Log in to respond to urgent requests near you.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 font-normal shadow-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 font-normal shadow-sm"
          />
        </label>

        {state.error && (
          <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn size={16} />
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-red-700 dark:text-red-400 underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
