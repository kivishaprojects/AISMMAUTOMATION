# AIDigiMarket — PRD Gap Analysis

**PRD:** AI-Powered SEO & GEO Automation Platform v1.0 · **Compared against product as of 2026-08-09** (updated after partial-tools build-out)

Legend: ✅ Built · 🟨 Partial · ❌ Missing

## Where the product already matches the PRD

| PRD area | Status | What exists today |
|---|---|---|
| §4 O1 Website SEO audit | 🟨 | Technical SEO Auditor (single-page crawler, on-page checks, broken links, PageSpeed CWV); **AI Scan** now adds multi-page site-level scanning with robots/sitemap/duplicate detection |
| §4 O2 AI recommendations (problem/why/impact/priority/auto-fix flag) | ✅ | AI Scan suggestions carry problem, why-it-matters, recommendation, expected outcome, affected URLs, impact, difficulty, executability |
| §4 O3 Automated execution (Preview → Approval → Execution → Verify → Rollback) | ✅ | site_changes framework: generate → edit/regenerate → approve → deploy as PR → **Verify on live site** (VERIFIED/VERIFY_FAILED) → **Rollback via revert PR** restoring recorded pre-change values |
| §7 AI Website Screening | ✅ | AI Scan (URL + business context input, technical/content/on-page/GEO analysis) |
| §8 Website Health Score with breakdown | ✅ | AI Scan scores: overall, technical, on-page, content, structured data, GEO readiness |
| §6 AI Search Visibility | 🟨 | Rank & AI Visibility: custom prompts vs OpenAI, mention rate + history, **competitor mention gap per check**. Missing: multi-engine checks (needs Perplexity/Gemini keys), entity/citation scoring |
| §15 Developer/Git integration (PRs) | ✅ | GitHub repo connection; approved fixes open a PR |
| §18 Keyword research | 🟨 | Keyword Intelligence: clustering, intent classification, gap detection, **seed-topic discovery mode** (AI generates 30-45 keyword ideas across intents; no fabricated volumes). Missing: real volume/difficulty data (needs paid API) |
| §24 Schema automation | ✅ | Schema Generator + AI Scan SCHEMA execution, both with **JSON-LD validation** (@context/@type + parse) before queueing; deploy-verify loop via change verification |
| §25 Change management log | ✅ | site_changes batches with full status lifecycle (DRAFT → DEPLOYED → VERIFIED/VERIFY_FAILED → ROLLED_BACK), PR links, stored before/after values, one-click rollback PR |
| §36 Multi-tenant orgs | 🟨 | Organizations, roles, team management. Missing: agency multi-client dashboard, white-label (org table has `is_white_label` flag, unused) |
| §48 Business model | ✅ | Stripe tiers (Starter/Growth/Enterprise/Agency) + credit wallet + BYO API key |

## Remaining facilities (not yet built) — priority order

**Built 2026-08-09 (formerly quick wins):**
1. ✅ **AI Content Studio** (§16–17) — briefs, article drafts, FAQ sets + schema, title/meta options, multilingual, optional page-grounding.
2. ✅ **LLM/GEO content optimizer** (§5) — crawls a page, rewrites weak spots for AI answer engines (direct answers, entities, Q&A, citation phrasing).
3. ✅ **SEO Command Center** (§27–28) — aggregate stats (health, GEO readiness, mention rate, approvals, deployed/verified fixes) + prioritized open-actions list from the latest scan.
4. ✅ **Internal Linking Engine** (§9, §11.4) — crawls provided pages, maps existing cross-links, finds orphans, proposes links with anchor text.
5. ✅ **AI SEO Assistant** (§29–30) — chat grounded in workspace data (scans, changes, tracked prompts).
6. ✅ **Competitor Intelligence (content-comparison)** (§20) — head-to-head page crawl + gap analysis.

**Needs external data/APIs:**
7. **SERP tracking** (§19) — needs a SERP API (DataForSEO/SerpAPI) or GSC integration.
8. **Competitor intelligence — data version** (§20) — content-comparison version now built; backlink/keyword overlap still needs Ahrefs/Semrush/DataForSEO.
9. **Backlink intelligence** (§21) — needs backlink data provider.
10. **Google Search Console + GA4 integration** (§9 keyword opportunities "positions 4–20", high-impressions-low-CTR) — *note: DB migration 017 (google_connections, analytics_reports) already exists remotely with no code; finish or drop.*

**Bigger architecture items (Phase 3–5):**
11. **CMS integrations** (§14) — WordPress/Shopify plugins beyond the current Git path.
12. **Multi-page distributed crawler** (§39) — current crawler is serverless single-request; full-site crawls need a queue/worker (e.g. Railway service + BullMQ).
13. **Autonomous agent system + automation levels 3–4** (§10–13) — scheduled agents, automation rules, task engine with statuses.
14. **Local & international SEO** (§22–23), **alerts** (§38), **scheduled reports** (§37), **client portal/white-label** (§36).

## Restructuring recommendations

- **Unify audit storage**: `seo_audits`, `ai_scans`, and `keyword_reports` are separate silos; the Command Center (§27) should read a common "findings" shape. Consider a `findings` view or normalizing suggestions into `site_changes`-style rows with severity.
- **Retire duplicate routes**: `/dashboard/analytics/{seo-audit,schema-generator,geo-tracking}` duplicate `/dashboard/seo/*` — make them redirects.
- **Task model** (§12): today a suggestion jumps straight to site_changes rows. Adding a lightweight `status` progression (Detected → Recommended → Approved → Executing → Completed/Verification Failed) onto ai_scans suggestions would match the PRD task engine without a new table.
- **Verification loop**: after a PR merges, a scheduled job should re-crawl affected URLs and stamp site_changes rows VERIFIED/FAILED — closing the PRD's core loop.
- **Crawler depth**: move from "8 pages per scan" to a background crawl service before building Internal Linking and Command Center, both of which want full-site link graphs.
