import Link from "next/link";
import { getCurrentUserOrgs } from "@/features/org/queries";
import { createClient } from "@/lib/supabase/server";
import type { ScanScores, ScanSuggestion } from "@/lib/ai/ai-scan";

export default async function CommandCenterPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  if (!org) return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;

  const supabase = await createClient();
  const [{ data: scans }, { data: changes }, { data: geoResults }, { data: audits }, { data: docs }] =
    await Promise.all([
      supabase.from("ai_scans").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("site_changes").select("status, label, page_url, created_at").eq("organization_id", org.id),
      supabase.from("geo_check_results").select("mentioned").eq("organization_id", org.id),
      supabase.from("seo_audits").select("id").eq("organization_id", org.id),
      supabase.from("content_docs").select("id").eq("organization_id", org.id),
    ]);

  const latestScan = scans?.[0] ?? null;
  const scores = latestScan ? (latestScan.scores as unknown as ScanScores) : null;
  const suggestions = latestScan ? ((latestScan.suggestions as unknown as ScanSuggestion[]) ?? []) : [];
  const statusCounts: Record<string, number> = {};
  for (const c of changes ?? []) statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  const mentions = geoResults ?? [];
  const mentionRate = mentions.length > 0 ? Math.round((mentions.filter((m) => m.mentioned).length / mentions.length) * 100) : null;

  const openSuggestions = suggestions
    .filter((s) => !s.executed_batch_id)
    .sort((a, b) => ["HIGH", "MEDIUM", "LOW"].indexOf(a.impact) - ["HIGH", "MEDIUM", "LOW"].indexOf(b.impact))
    .slice(0, 8);

  const stats = [
    { label: "SEO Health", value: scores ? `${scores.overall}/100` : "—", href: "/dashboard/seo/ai-scan" },
    { label: "GEO Readiness", value: scores ? `${scores.geoReadiness}/100` : "—", href: "/dashboard/seo/ai-scan" },
    { label: "AI mention rate", value: mentionRate !== null ? `${mentionRate}%` : "—", href: "/dashboard/seo/rank-tracking" },
    { label: "Pending approvals", value: statusCounts["DRAFT"] ?? 0, href: "/dashboard/seo/ai-scan" },
    { label: "Deployed fixes", value: (statusCounts["DEPLOYED"] ?? 0) + (statusCounts["VERIFIED"] ?? 0), href: "/dashboard/seo/ai-scan" },
    { label: "Verified live", value: statusCounts["VERIFIED"] ?? 0, href: "/dashboard/seo/ai-scan" },
    { label: "Audits run", value: (audits?.length ?? 0) + (scans?.length ?? 0), href: "/dashboard/seo/technical-audit" },
    { label: "Content documents", value: docs?.length ?? 0, href: "/dashboard/seo/content-studio" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">SEO Command Center</h1>
        <p className="mt-1 text-sm text-neutral-500">
          One view across every SEO tool: health, pending work, and the next highest-impact actions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-brand-300">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Next highest-impact actions</h2>
        {!latestScan ? (
          <p className="mt-2 text-sm text-neutral-500">
            No AI Scan yet — <Link href="/dashboard/seo/ai-scan" className="text-brand-600 underline">run one</Link>{" "}
            to populate the action list.
          </p>
        ) : openSuggestions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            All suggestions from the latest scan have been executed. Re-scan to find the next round.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-neutral-100">
            {openSuggestions.map((s) => (
              <Link key={s.id} href={`/dashboard/seo/ai-scan?scan=${latestScan.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">{s.title}</p>
                  <p className="truncate text-xs text-neutral-500">{s.problem}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  s.impact === "HIGH" ? "bg-red-100 text-red-700" : s.impact === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"
                }`}>{s.impact}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
