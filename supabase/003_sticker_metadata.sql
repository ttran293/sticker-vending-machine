-- Sticker metadata overrides (admin-managed via dashboard)
create table if not exists public.sticker_metadata (
  image_path text primary key,
  name text check (name is null or char_length(name) <= 80),
  updated_at timestamptz not null default now()
);

alter table public.sticker_metadata enable row level security;

create policy "Anyone can read sticker metadata"
  on public.sticker_metadata
  for select
  using (true);

-- Admin writes go through Next.js API routes using the service role key (bypasses RLS).
