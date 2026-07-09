-- Discount coupons (admin-managed via dashboard)
create table if not exists public.coupons (
  code text primary key,
  label text not null,
  percent_off numeric not null check (percent_off > 0 and percent_off <= 100),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "Anyone can read enabled coupons"
  on public.coupons
  for select
  using (enabled = true);

-- Admin writes go through Next.js API routes using the service role key (bypasses RLS).

insert into public.coupons (code, label, percent_off, enabled)
values
  ('FREE100', '100% off', 100, true),
  ('HALF50', '50% off', 50, true),
  ('SAVE20', '20% off', 20, true)
on conflict (code) do nothing;
