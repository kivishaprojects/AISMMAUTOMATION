import { getCurrentUserOrgs } from "@/features/org/queries";

export default async function DashboardPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Welcome back{org ? `, ${org.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Here&apos;s what&apos;s happening across your marketing.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Plan", value: org?.plan ?? "—" },
          { label: "Your role", value: org?.role ?? "—" },
          { label: "Scheduled posts", value: "0" },
          { label: "AI generations this month", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">
          This is the real dashboard shell, reading live data from your
          Supabase project through RLS. Next modules (Creative Studio,
          Scheduler, Inbox) will fill this in.
        </p>
      </div>
    </div>
  );
}
