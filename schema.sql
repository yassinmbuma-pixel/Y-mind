create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country_code text not null default 'TZ',
  city text not null default 'Dar es Salaam',
  category text not null,
  description text not null,
  products_services jsonb not null default '[]'::jsonb,
  service_areas jsonb not null default '[]'::jsonb,
  website_url text,
  lead_destination text,
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  objective text not null default 'qualified_leads' check (objective in ('qualified_leads','sales','inquiries')),
  target_location text not null,
  target_keywords jsonb not null default '[]'::jsonb,
  offer text not null,
  landing_page_url text,
  status text not null default 'draft' check (status in ('draft','review','active','paused','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_type text not null check (source_type in ('public_business','inbound_form','referral','ad_lead','manual')),
  source_url text,
  organization_name text,
  contact_name text,
  email text,
  phone text,
  location text,
  need_summary text,
  intent_evidence text,
  intent_observed_at timestamptz,
  score smallint check (score between 0 and 100),
  score_reason jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new','reviewed','qualified','contacted','replied','converted','disqualified','suppressed')),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','sms','phone')),
  basis text not null check (basis in ('explicit_opt_in','inbound_request','permitted_business_outreach','not_permitted')),
  evidence text,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.outreach_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','sms','manual')),
  purpose text not null,
  message_text text not null,
  status text not null default 'pending_review' check (status in ('pending_review','approved','queued','sent','delivered','replied','failed','cancelled')),
  idempotency_key text unique,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.suppressions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel text not null,
  destination_hash text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (business_id, channel, destination_hash)
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  event_type text not null check (event_type in ('qualified','meeting_booked','quote_requested','sale','disqualified','opt_out')),
  value_amount numeric(12,2),
  currency text default 'TZS',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists prospects_business_status_idx on public.prospects (business_id, status, created_at desc);
create index if not exists campaigns_business_status_idx on public.campaigns (business_id, status);
create index if not exists outreach_pending_idx on public.outreach_tasks (status, created_at) where status in ('pending_review','approved','queued');
create index if not exists lead_events_business_idx on public.lead_events (business_id, created_at desc);

alter table public.businesses enable row level security;
alter table public.campaigns enable row level security;
alter table public.prospects enable row level security;
alter table public.contact_permissions enable row level security;
alter table public.outreach_tasks enable row level security;
alter table public.suppressions enable row level security;
alter table public.lead_events enable row level security;

create policy "owners manage own businesses" on public.businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "business owners manage campaigns" on public.campaigns
  for all using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "business owners manage prospects" on public.prospects
  for all using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "business owners manage permissions" on public.contact_permissions
  for all using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "business owners manage outreach" on public.outreach_tasks
  for all using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "business owners manage suppressions" on public.suppressions
  for all using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "business owners manage lead events" on public.lead_events
  for all using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
