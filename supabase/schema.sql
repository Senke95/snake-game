create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 16),
  score integer not null check (score >= 0 and score <= 99999),
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc);
create index if not exists scores_created_at_idx on public.scores (created_at asc);

alter table public.scores enable row level security;

drop policy if exists scores_select_public on public.scores;
create policy scores_select_public
on public.scores
for select
using (true);

drop policy if exists scores_insert_public on public.scores;
create policy scores_insert_public
on public.scores
for insert
with check (true);
