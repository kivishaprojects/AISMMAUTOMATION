# AIDigiMarket — Pending Tasks to Complete the Solution
_As of 2026-08-09. Ordered by priority within each phase._

## P1 — Buildable now (no external accounts needed)
| # | Task | Notes |
|---|------|-------|
| 1 | **Automation Workflows** (last Coming Soon stub) | Re-add Vercel cron: daily sitemap ping to search engines, stale-content alerts (audits older than N days), scheduled auto-verification of DEPLOYED site_changes, scheduled GEO checks. Closes PRD §13 Level-3 automation. |
| 2 | **Assistant chat history in DB** | Conversations table + past-conversations list; today's chat restores per device (localStorage) only. |
| 3 | **Legacy route redirects** | `/dashboard/analytics/{seo-audit,schema-generator,geo-tracking}` → redirect to `/dashboard/seo/*` equivalents. |
| 4 | **Org switcher** | All pages use the user's first org; a TopBar org selector (cookie-based) unblocks true multi-org use and is the precursor to agency features. |
| 5 | **Task lifecycle on scan suggestions** (PRD §12) | Status progression Detected → Recommended → Approved → Executing → Completed/Verification-Failed surfaced on AI Scan + Command Center. |
| 6 | **Unify findings storage** | Common "findings" view across seo_audits / ai_scans / keyword_reports so Command Center aggregates everything, not just the latest scan. |
| 7 | **Deployment hygiene** | Paste SUPABASE_SERVICE_ROLE_KEY into Vercel + .env.local; decide GA tables from migration 017 (finish in #10 or drop); optionally rename Vercel project marketing-os → aidigimarket and attach a custom domain; fix git author identity (currently "AI Marketing OS <you@example.com>"). |
| 8 | **Launch checks** | Verify Stripe live-mode prices/webhook on production domain; RLS/security advisor pass on Supabase; rate limiting on AI endpoints. |

## P2 — Blocked on accounts/API keys (code is ready to be written once keys exist)
| # | Task | Requires |
|---|------|----------|
| 9 | **SERP / rank tracking** (§19) | DataForSEO or SerpAPI account |
| 10 | **Google Search Console + GA4 integration** (§9) | Google Cloud OAuth app; DB tables already exist (migration 017) |
| 11 | **Keyword volume/difficulty data** (§18) | Same SERP/keyword data provider as #9 |
| 12 | **Backlink intelligence + full competitor data** (§20–21) | Ahrefs / Semrush / DataForSEO backlinks API |
| 13 | **Multi-engine GEO checks** (§6) | Perplexity and/or Gemini API keys |

## P3 — Architecture investments (Phase 3–5 of PRD)
| # | Task | Notes |
|---|------|-------|
| 14 | **Background crawler service** (§39) | Railway worker + queue; lifts the 8-page scan cap, enables full-site link graphs (feeds Internal Linking + Command Center). |
| 15 | **Autonomous agents + automation rules** (§10–13) | User-configurable rules ("auto-fix alt text, never touch URLs"), scheduled agent runs, Level-4 autonomy. Builds on #1 + #5. |
| 16 | **Agency suite** (§36–37) | Multi-client dashboard, white-label branding (is_white_label flag exists unused), client portal, scheduled PDF/CSV reports, alerts (§38). Builds on #4. |
| 17 | **CMS integrations** (§14) | WordPress plugin + Shopify app for non-Git sites (currently GitHub-PR-only execution). |
| 18 | **Local & international SEO** (§22–23) | Location pages, NAP checks, hreflang analysis — partially buildable now, more valuable after #9/#10. |

## Definition of "complete" (PRD §54)
Connect website → AI diagnosis → prioritized opportunities → approve/automate fixes → platform executes →
verifies every change → monitors results → recommends next actions. Items 1, 9, 10, 14, 15 are the
remaining pieces of that loop (continuous monitoring + autonomous re-optimization); everything else is reach.
