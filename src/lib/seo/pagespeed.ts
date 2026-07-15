import "server-only";

export type PageSpeedResult = {
  performanceScore: number | null;
  lcp: string | null;
  cls: string | null;
  inp: string | null;
} | null;

/**
 * PageSpeed Insights has a small free quota without any API key (works
 * for occasional use), and a much higher quota with a free Google Cloud
 * API key (GOOGLE_PAGESPEED_API_KEY). Returns null rather than throwing
 * if it's unavailable, since Core Web Vitals are a bonus on top of the
 * on-page checks, not something the whole audit should fail without.
 */
export async function getPageSpeedData(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const params = new URLSearchParams({
    url,
    strategy: "mobile",
    category: "performance",
  });
  if (apiKey) params.set("key", apiKey);

  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const perfScore = data?.lighthouseResult?.categories?.performance?.score;
    const audits = data?.lighthouseResult?.audits ?? {};

    return {
      performanceScore: typeof perfScore === "number" ? Math.round(perfScore * 100) : null,
      lcp: audits["largest-contentful-paint"]?.displayValue ?? null,
      cls: audits["cumulative-layout-shift"]?.displayValue ?? null,
      inp: audits["interaction-to-next-paint"]?.displayValue ?? audits["max-potential-fid"]?.displayValue ?? null,
    };
  } catch {
    return null;
  }
}
