alter table public.organizations
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_status text;
