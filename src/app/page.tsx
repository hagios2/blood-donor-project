import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-bold text-red-700">BloodLink</h1>
      <p className="mt-4 max-w-lg text-lg text-gray-600">
        Urgent blood request matching between hospitals, donors, and nearby hospitals
        with surplus stock.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-red-600 px-6 py-3 font-medium text-white"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
