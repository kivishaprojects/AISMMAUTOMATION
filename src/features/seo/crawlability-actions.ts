"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  siteUrl: z.string().url("Enter your site's root URL"),
  pageUrls: z.string().min(3, "List at least one page URL"),
});

function buildRobotsTxt(siteUrl: string): string {
  const origin = new URL(siteUrl).origin;
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap.xml`].join("\n");
}

function buildSitemapXml(urls: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const entries = urls
    .map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export async function generateCrawlabilityFilesAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = schema.safeParse({
    siteUrl: formData.get("siteUrl"),
    pageUrls: formData.get("pageUrls"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const pageUrls = parsed.data.pageUrls.split("\n").map((u) => u.trim()).filter(Boolean).slice(0, 500);
  const batchId = crypto.randomUUID();

  const robotsTxt = buildRobotsTxt(parsed.data.siteUrl);
  const sitemapXml = buildSitemapXml(pageUrls);

  const { error } = await supabase.from("site_changes").insert([
    {
      organization_id: organizationId,
      created_by: user.id,
      batch_id: batchId,
      page_url: null,
      change_type: "ROBOTS_TXT",
      label: "robots.txt",
      current_value: null,
      proposed_value: robotsTxt,
      file_path: "public/robots.txt",
    },
    {
      organization_id: organizationId,
      created_by: user.id,
      batch_id: batchId,
      page_url: null,
      change_type: "SITEMAP_XML",
      label: `sitemap.xml (${pageUrls.length} URLs)`,
      current_value: null,
      proposed_value: sitemapXml,
      file_path: "public/sitemap.xml",
    },
  ]);

  if (error) return { error: error.message };

  return { success: true, batchId };
}
