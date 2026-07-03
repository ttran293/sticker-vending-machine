-- One row per machine slot (0–19 → A1–D5)
create table if not exists public.machine_slots (
  slot_index int primary key check (slot_index >= 0 and slot_index < 20),
  image_path text,
  updated_at timestamptz not null default now()
);

alter table public.machine_slots enable row level security;

create policy "Anyone can read machine slots"
  on public.machine_slots
  for select
  using (true);

-- Admin writes go through Next.js API routes using the service role key (bypasses RLS).

insert into public.machine_slots (slot_index, image_path)
values
  (0, '/stickers/hat-dog/bucket-hat.png'),
  (1, '/stickers/hat-dog/hat-angry.png'),
  (2, '/stickers/hat-dog/hat-and-smie.png'),
  (3, '/stickers/hat-dog/hat-cute.png'),
  (4, '/stickers/hat-dog/jelly-with-hat.png'),
  (5, '/stickers/cat_climb/v0.png'),
  (6, '/stickers/cat_climb/v2.png'),
  (7, '/stickers/cat_climb/v3.png'),
  (8, '/stickers/cat_climb/v5.png'),
  (9, '/stickers/cat_climb/v7.png'),
  (10, '/stickers/cat_climb_exp/p2-1.png'),
  (11, '/stickers/cat_climb_exp/p2-2.png'),
  (12, '/stickers/cat_climb_exp/p2-3.png'),
  (13, '/stickers/cat_climb_exp/p2-4.png'),
  (14, '/stickers/cat_climb_exp/p2-5.png'),
  (15, '/stickers/buttercup/bad-hair-day.png'),
  (16, '/stickers/buttercup/costume.png'),
  (17, '/stickers/buttercup/hello-phone.png'),
  (18, '/stickers/buttercup/proud.png'),
  (19, '/stickers/buttercup/wide-eyes.png')
on conflict (slot_index) do nothing;
