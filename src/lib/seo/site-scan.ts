import "server-only";
import { crawlPage, checkBrokenLinks, type CrawlResult } from "@/lib/seo/crawler";

export type PageSnapshot = {
  url: string;
  ok: boolean;
  error?: string;
  crawl?: CrawlResult;
};

export type SiteScanData = {
  siteUrl: string;
  robotsTxt: { found: boolean; content: string | null; blocksAll: boolean; sitemapUrls: string[] };
  sitemap: { found: boolean; url: string | null; urlCount: number };
  pages: PageSnapshot[];
  duplicateTitles: string[];
  duplicateMetas: string[];
  brokenLinks: { url: string; status: number | null }[];
  https: boolean;
};

const MAX_PAGES = 8;

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIDigiMarket-AIScan/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractSitemapUrls(xml: string, limit = 200): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && urls.length < limit) urls.push(m[1]);
  return urls;
}

/**
 * Best-effort whole-site scan within a serverless time budget: discovers URLs
 * via sitemap (falling back to homepage internal links), crawls up to
 * MAX_PAGES representative pages, and aggregates cross-page signals like
 * duplicate titles/metas that single-page tools can't see.
 */
export async function scanSite(inputUrl: string): Promise<SiteScanData> {
  const siteUrl = inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`;
  const origin = new URL(siteUrl).origin;
  const https = origin.startsWith("https://");

  const robotsContent = await fetchText(`${origin}/robots.txt`);
  const robotsSitemaps =
    robotsContent?.match(/^sitemap:\s*(\S+)/gim)?.map((l) => l.replace(/^sitemap:\s*/i, "").trim()) ?? [];
  const blocksAll = !!robotsContent && /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*$/im.test(robotsContent);

  let sitemapUrl: string | null = null;
  let sitemapUrls: string[] = [];
  for (const candidate of [...robotsSitemaps, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]) {
    const xml = await fetchText(candidate);
    if (xml && /<(urlset|sitemapindex)/i.test(xml)) {
      sitemapUrl = candidate;
      let urls = extractSitemapUrls(xml);
      // sitemap index: follow the first child sitemap for page URLs
      if (/<sitemapindex/i.test(xml) && urls.length > 0) {
        const childXml = await fetchText(urls[0]);
        if (childXml) urls = extractSitemapUrls(childXml);
      }
      sitemapUrls = urls.filter((u) => u.startsWith(origin));
      break;
    }
  }

  const homepage = await crawlPage(siteUrl).then(
    (crawl): PageSnapshot => ({ url: siteUrl, ok: true, crawl }),
    (err): PageSnapshot => ({ url: siteUrl, ok: false, error: err instanceof Error ? err.message : "Fetch failed" })
  );

  const candidateUrls = (sitemapUrls.length > 0 ? sitemapUrls : homepage.crawl?.internalLinks ?? [])
    .filter((u) => u !== siteUrl && u !== homepage.crawl?.finalUrl)
    .filter((u) => !/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|xml|css|js)(\?|$)/i.test(u));
  const uniqueCandidates = [...new Set(candidateUrls)].slice(0, MAX_PAGES - 1);

  const pages: PageSnapshot[] = [homepage];
  for (const url of uniqueCandidates) {
    const snap = await crawlPage(url).then(
      (crawl): PageSnapshot => ({ url, ok: true, crawl }),
      (err): PageSnapshot => ({ url, ok: false, error: err instanceof Error ? err.message : "Fetch failed" })
    );
    pages.push(snap);
  }

  const titleCounts = new Map<string, number>();
  const metaCounts = new Map<string, number>();
  for (const p of pages) {
    if (p.crawl?.title) titleCounts.set(p.crawl.title, (titleCounts.get(p.crawl.title) ?? 0) + 1);
    if (p.crawl?.metaDescription) metaCounts.set(p.crawl.metaDescription, (metaCounts.get(p.crawl.metaDescription) ?? 0) + 1);
  }
  const duplicateTitles = [...titleCounts.entries()].filter(([, n]) => n > 1).map(([t]) => t);
  const duplicateMetas = [...metaCounts.entries()].filter(([, n]) => n > 1).map(([t]) => t);

  const brokenLinks = homepage.crawl ? await checkBrokenLinks(homepage.crawl.internalLinks, 10) : [];

  return {
    siteUrl,
    robotsTxt: { found: !!robotsContent, content: robotsContent?.slice(0, 2000) ?? null, blocksAll, sitemapUrls: robotsSitemaps },
    sitemap: { found: !!sitemapUrl, url: sitemapUrl, urlCount: sitemapUrls.length },
    pages,
    duplicateTitles,
    duplicateMetas,
    brokenLinks,
    https,
  };
}

/** Compact, token-bounded description of the scan for the AI analysis call. */
export function summarizeScanForAi(data: SiteScanData): string {
  const lines: string[] = [
    `Site: ${data.siteUrl}`,
    `HTTPS: ${data.https}`,
    `robots.txt: ${data.robotsTxt.found ? "found" : "MISSING"}${data.robotsTxt.blocksAll ? " — WARNING: appears to disallow all crawling" : ""}`,
    `XML sitemap: ${data.sitemap.found ? `found (${data.sitemap.urlCount} URLs)` : "MISSING"}`,
    `Broken internal links (sampled): ${data.brokenLinks.length > 0 ? data.brokenLinks.map((b) => `${b.url} [${b.status ?? "unreachable"}]`).join(", ") : "none found"}`,
    `Duplicate titles across crawled pages: ${data.duplicateTitles.length > 0 ? data.duplicateTitles.join(" | ") : "none"}`,
    `Duplicate meta descriptions across crawled pages: ${data.duplicateMetas.length > 0 ? String(data.duplicateMetas.length) : "none"}`,
    ``,
    `Crawled pages (${data.pages.length}):`,
  ];

  for (const p of data.pages) {
    if (!p.ok || !p.crawl) {
      lines.push(`- ${p.url}: FAILED TO FETCH (${p.error})`);
      continue;
    }
    const c = p.crawl;
    lines.push(
      [
        `- ${c.finalUrl}`,
        `  title: ${c.title ? `"${c.title}" (${c.title.length} chars)` : "MISSING"}`,
        `  meta: ${c.metaDescription ? `"${c.metaDescription.slice(0, 120)}" (${c.metaDescription.length} chars)` : "MISSING"}`,
        `  h1: ${c.h1Count === 1 ? `"${c.h1Text[0]}"` : `${c.h1Count} found`}; h2s: ${c.h2Text.slice(0, 5).join(" | ") || "none"}`,
        `  canonical: ${c.hasCanonical ? "yes" : "MISSING"}; noindex: ${c.isNoindex}; viewport: ${c.hasViewportMeta}`,
        `  schema: ${c.schemaTypes.join(", ") || "NONE"}; FAQ schema: ${c.hasFaqSchema}`,
        `  OG tags: ${c.ogTitle && c.ogDescription && c.ogImage ? "complete" : "incomplete"}; Twitter card: ${c.twitterCard ?? "MISSING"}`,
        `  images: ${c.imagesTotal} total, ${c.imagesMissingAlt} missing alt; words: ${c.wordCount}; internal links: ${c.internalLinks.length}`,
        `  content sample: ${c.bodyTextSample.slice(0, 300)}`,
      ].join("\n")
    );
  }
  return lines.join("\n");
}
