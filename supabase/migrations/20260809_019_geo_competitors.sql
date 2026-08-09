alter table public.geo_tracked_prompts add column competitors text;
alter table public.geo_check_results add column competitor_mentions jsonb;
