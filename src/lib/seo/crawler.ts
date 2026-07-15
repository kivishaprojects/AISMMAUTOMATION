import "server-only";
import * as cheerio from "cheerio";

export type SeoCheck = { label: string; passed: boolean; detail?: string };

export type MissingAltImage = { src: string; nearbyText: string };

export type CrawlResult = {
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h1Text: string[];
  imagesTotal: number;
  imagesMissingAlt: number;
  imagesMissingAltSrcs: string[];
  imagesMissingAltSample: MissingAltImage[];
  hasCanonical: boolean;
  isNoindex: boolean;
  hasViewportMeta: boolean;
  schemaTypes: string[];
  internalLinks: string[];
  externalLinks: string[];
  wordCount: number;
  bodyTextSample: string;
};

export async function crawlPage(url: string): Promise<CrawlResult> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AIMarketingOS-SEOAudit/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Could not fetch the page (HTTP ${res.status})`);
  }
  const html = await res.text();
  const finalUrl = res.url || url;
  const $ = cheerio.load(html);
  const origin = new URL(finalUrl).origin;

  const title = $("title").first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;
  const h1Text = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const images = $("img");
  const imagesMissingAltSrcs: string[] = [];
  images.each((_, el) => {
    if (!$(el).attr("alt")?.trim()) {
      const src = $(el).attr("src");
      if (src) {
        try {
          imagesMissingAltSrcs.push(new URL(src, finalUrl).toString());
        } catch {
          // unparseable src, skip
        }
      }
    }
  });
  const imagesMissingAlt = imagesMissingAltSrcs.length;
  const imagesMissingAltSample: MissingAltImage[] = [];
  images.each((_, el) => {
    if (imagesMissingAltSample.length >= 10) return;
    const $el = $(el);
    if ($el.attr("alt")?.trim()) return;
    const src = $el.attr("src") || $el.attr("data-src");
    if (!src) return;
    const nearbyText = $el.closest("figure, div, section, article, p").text().replace(/\s+/g, " ").trim().slice(0, 200);
    imagesMissingAltSample.push({ src: new URL(src, finalUrl).toString(), nearbyText });
  });
  const hasCanonical = $('link[rel="canonical"]').length > 0;
  const robotsContent = $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
  const isNoindex = robotsContent.includes("noindex");
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;

  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const type = item["@type"];
        if (type) schemaTypes.push(Array.isArray(type) ? type.join(", ") : type);
      }
    } catch {
      // malformed JSON-LD \u2014 ignore rather than fail the whole audit
    }
  });

  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const resolved = new URL(href, finalUrl).toString();
      if (resolved.startsWith(origin)) internalLinks.add(resolved);
      else externalLinks.add(resolved);
    } catch {
      // ignore unparseable hrefs
    }
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").length : 0;

  return {
    finalUrl,
    title,
    metaDescription,
    h1Count: h1Text.length,
    h1Text,
    imagesTotal: images.length,
    imagesMissingAlt,
    imagesMissingAltSrcs,
    imagesMissingAltSample,
    hasCanonical,
    isNoindex,
    hasViewportMeta,
    schemaTypes,
    internalLinks: [...internalLinks].slice(0, 50),
    externalLinks: [...externalLinks].slice(0, 50),
    wordCount,
    bodyTextSample: bodyText.slice(0, 500),
  };
}

/**
 * Checks a sample of links for broken status. Capped and run with limited
 * concurrency to keep this within a serverless function's time budget \u2014
 * a full-site link audit is out of scope for a single-page tool like this.
 */
export async function checkBrokenLinks(links: string[], limit = 15): Promise<{ url: string; status: number | null }[]> {
  const sample = links.slice(0, limit);
  const results = await Promise.all(
    sample.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD", redirect: "follow" });
        return { url, status: res.status };
      } catch {
        return { url, status: null };
      }
    })
  );
  return results.filter((r) => r.status === null || r.status >= 400);
}

export function buildOnPageChecklist(crawl: CrawlResult, brokenLinks: { url: string }[]): SeoCheck[] {
  return [
    { label: "Title tag present", passed: !!crawl.title, detail: crawl.title ?? undefined },
    {
      label: "Title length reasonable (30-60 chars)",
      passed: !!crawl.title && crawl.title.length >= 30 && crawl.title.length <= 60,
      detail: crawl.title ? `${crawl.title.length} chars` : undefined,
    },
    { label: "Meta description present", passed: !!crawl.metaDescription, detail: crawl.metaDescription ?? undefined },
    {
      label: "Meta description length reasonable (120-160 chars)",
      passed: !!crawl.metaDescription && crawl.metaDescription.length >= 120 && crawl.metaDescription.length <= 160,
      detail: crawl.metaDescription ? `${crawl.metaDescription.length} chars` : undefined,
    },
    { label: "Exactly one H1", passed: crawl.h1Count === 1, detail: `${crawl.h1Count} found` },
    {
      label: "All images have alt text",
      passed: crawl.imagesMissingAlt === 0,
      detail: crawl.imagesMissingAlt > 0 ? `${crawl.imagesMissingAlt} of ${crawl.imagesTotal} missing` : undefined,
    },
    { label: "Canonical tag present", passed: crawl.hasCanonical },
    { label: "Not blocked from indexing", passed: !crawl.isNoindex },
    { label: "Mobile viewport tag present", passed: crawl.hasViewportMeta },
    { label: "Schema markup present", passed: crawl.schemaTypes.length > 0, detail: crawl.schemaTypes.join(", ") || undefined },
    { label: "Sufficient content length (300+ words)", passed: crawl.wordCount >= 300, detail: `${crawl.wordCount} words` },
    { label: "No broken links in sample checked", passed: brokenLinks.length === 0, detail: brokenLinks.length > 0 ? `${brokenLinks.length} broken` : undefined },
  ];
}
