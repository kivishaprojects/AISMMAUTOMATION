import { CreditCard, UserCircle, CalendarClock, Sparkles } from "lucide-react";
import { getCurrentUserOrgs } from "@/features/org/queries";
import { getDashboardStats, getRecentActivity } from "@/features/org/dashboard-stats";
import { ActivityChart } from "@/features/org/ActivityChart";

export default async function DashboardPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  const [stats, activity] = org
    ? await Promise.all([getDashboardStats(org.id), getRecentActivity(org.id)])
    : [null, []];

  const cards = [
    {
      label: "Plan",
      value: org?.plan ?? "—",
      icon: CreditCard,
      tint: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Your role",
      value: org?.role ?? "—",
      icon: UserCircle,
      tint: "bg-violet-50 text-violet-600",
    },
    {
      label: "Scheduled posts",
      value: stats?.scheduledPosts ?? 0,
      icon: CalendarClock,
      tint: "bg-amber-50 text-amber-600",
    },
    {
      label: "AI generations this month",
      value: stats?.aiGenerationsThisMonth ?? 0,
      icon: Sparkles,
      tint: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Welcome back{org ? `, ${org.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Here&apos;s what&apos;s happening across your marketing.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tint}`}>
                <Icon size={18} strokeWidth={2} />
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <ActivityChart data={activity} />
      </div>
    </div>
  );
}
