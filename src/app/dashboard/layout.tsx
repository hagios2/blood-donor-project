import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logOut } from "@/app/login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <span className="text-lg font-semibold text-red-700 dark:text-red-400">BloodLink</span>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {profile && (
            <span>
              {profile.name} <span className="text-gray-400 dark:text-gray-500">({profile.role})</span>
            </span>
          )}
          <form action={logOut}>
            <button className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 font-medium text-gray-700 dark:text-gray-200">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
