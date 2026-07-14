import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrgs } from "@/features/org/queries";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

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
      <Sidebar orgName={activeOrg?.name} orgRole={activeOrg?.role} />
      <div className="flex flex-1 flex-col">
        <TopBar
          userEmail={user.email ?? ""}
          userName={(user.user_metadata as { full_name?: string })?.full_name}
        />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
