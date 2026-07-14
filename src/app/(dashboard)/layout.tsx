import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrgs } from "@/features/org/queries";
import { signOutAction } from "@/features/auth/actions";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Creative Studio", href: "/dashboard/studio" },
  { label: "Scheduler", href: "/dashboard/scheduler" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Brand Kit", href: "/dashboard/brand-kit" },
  { label: "Team", href: "/dashboard/team" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const orgs = await getCurrentUserOrgs();
  const activeOrg = orgs[0];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-60 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold text-neutral-900">
            AI Marketing OS
          </p>
          {activeOrg && (
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {activeOrg.name} · {activeOrg.role}
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <p className="truncate px-2 text-xs text-neutral-500">
            {user.email}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
