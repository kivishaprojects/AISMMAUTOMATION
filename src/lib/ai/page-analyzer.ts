import "server-only";
import type { PageAuditData } from "@/lib/social/meta";

export type ChecklistItem = { label: string; passed: boolean };

export type PageReport = {
  score: number;
  checklist: ChecklistItem[];
  stats: {
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    postsAnalyzed: number;
    postingFrequencyDays: number | null;
  };
  recommendations: string;
};

function buildChecklist(data: PageAuditData): ChecklistItem[] {
  return [
    { label: "Profile picture set", passed: data.hasProfilePicture },
    { label: "Cover photo set", passed: data.hasCoverPhoto },
    { label: "About section filled in", passed: !!data.about && data.about.length > 20 },
    { label: "Category set", passed: !!data.category },
    { label: "Website linked", passed: data.hasWebsite },
    { label: "Phone number listed", passed: data.hasPhone },
    { label: "Address listed", passed: data.hasAddress },
    { label: "Business hours listed", passed: data.hasHours },
    { label: "Posted in the last 7 days", passed: hasRecentPost(data, 7) },
    { label: "Posts at least weekly", passed: postingFrequency(data) !== null && postingFrequency(data)! <= 7 },
  ];
}

function hasRecentPost(data: PageAuditData, withinDays: number): boolean {
  if (data.recentPosts.length === 0) return false;
  const mostRecent = new Date(data.recentPosts[0].createdTime).getTime();
  return Date.now() - mostRecent < withinDays * 24 * 60 * 60 * 1000;
}

function postingFrequency(data: PageAuditData): number | null {
  if (data.recentPosts.length < 2) return null;
  const dates = data.recentPosts.map((p) => new Date(p.createdTime).getTime()).sort((a, b) => b - a);
  const gaps = dates.slice(0, -1).map((d, i) => (d - dates[i + 1]) / (1000 * 60 * 60 * 24));
  return gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
}

/**
 * Combines the completeness checklist and engagement stats with an
 * OpenAI-written set of prioritized recommendations. The score and
 * checklist are computed deterministically (not left to the model) so
 * they're consistent and auditable \u2014 only the written recommendations
 * are AI-generated.
 */
export async function buildPageReport({
  data,
  apiKeyOverride,
}: {
  data: PageAuditData;
  apiKeyOverride?: string | null;
}): Promise<PageReport> {
  const checklist = buildChecklist(data);
  const passedCount = checklist.filter((c) => c.passed).length;
  const checklistScore = (passedCount / checklist.length) * 60; // checklist worth 60% of score

  const posts = data.recentPosts;
  const avgLikes = posts.length ? Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length) : 0;
  const avgComments = posts.length ? Math.round(posts.reduce((s, p) => s + p.comments, 0) / posts.length) : 0;
  const avgShares = posts.length ? Math.round(posts.reduce((s, p) => s + p.shares, 0) / posts.length) : 0;
  const freq = postingFrequency(data);

  // Engagement worth the other 40%: reward any real engagement, more for
  // higher relative-to-follower engagement, capped reasonably.
  const followers = data.followersCount || data.fanCount || 1;
  const engagementRate = followers > 0 ? (avgLikes + avgComments * 2 + avgShares * 3) / followers : 0;
  const engagementScore = Math.min(40, engagementRate * 4000);

  const score = Math.round(Math.min(100, checklistScore + engagementScore));

  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  let recommendations = "Add an OpenAI key to generate written recommendations.";

  if (apiKey) {
    const summary = [
      `Page: ${data.name} (${data.category ?? "no category"})`,
      `Followers: ${data.followersCount ?? data.fanCount ?? "unknown"}`,
      `Checklist passed: ${passedCount}/${checklist.length} \u2014 failing: ${checklist.filter((c) => !c.passed).map((c) => c.label).join(", ") || "none"}`,
      `Last ${posts.length} posts \u2014 avg likes: ${avgLikes}, avg comments: ${avgComments}, avg shares: ${avgShares}`,
      `Posting frequency: ${freq ? `every ${freq.toFixed(1)} days` : "not enough data"}`,
      posts[0]?.message ? `Most recent post: "${posts[0].message.slice(0, 200)}"` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a social media growth consultant. Given real Facebook Page data, " +
              "write 4-6 specific, prioritized, actionable recommendations to improve reach " +
              "and engagement. Be concrete (not generic advice like 'post more'). Format as " +
              "a numbered list, each item one or two sentences.",
          },
          { role: "user", content: summary },
        ],
        temperature: 0.6,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      recommendations = json.choices?.[0]?.message?.content ?? recommendations;
    } else {
      recommendations = "Could not generate recommendations right now \u2014 try again shortly.";
    }
  }

  return {
    score,
    checklist,
    stats: { avgLikes, avgComments, avgShares, postsAnalyzed: posts.length, postingFrequencyDays: freq },
    recommendations,
  };
}
