-- === SCHEMA SUPABASE — CarbCycle ===
-- Colle ce SQL dans l'éditeur SQL de ton projet Supabase (onglet "SQL Editor")

-- Table des entrées journalières
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  type        text check (type in ('normal','low','cheat','fast')) default 'normal',
  sport       text,
  meal1       text,
  meal2       text,
  meal3       text,
  meal4       text,
  cal         integer default 0,
  carbs       integer default 0,
  prot        integer default 0,
  fat         integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, date)
);

-- Index pour accélérer les requêtes par utilisateur + date
create index if not exists entries_user_date on public.entries(user_id, date);

-- Mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists entries_updated_at on public.entries;
create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- Activer Row Level Security
alter table public.entries enable row level security;

-- Chaque utilisateur ne voit et ne modifie que ses propres données
create policy "Lecture propre" on public.entries
  for select using (auth.uid() = user_id);

create policy "Insertion propre" on public.entries
  for insert with check (auth.uid() = user_id);

create policy "Modification propre" on public.entries
  for update using (auth.uid() = user_id);

create policy "Suppression propre" on public.entries
  for delete using (auth.uid() = user_id);

-- === TABLE DES MESURES CORPORELLES ===
create table if not exists public.measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  weight_kg   numeric(5,1),
  waist_cm    numeric(5,1),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, week_start)
);

create index if not exists measurements_user_week on public.measurements(user_id, week_start);

drop trigger if exists measurements_updated_at on public.measurements;
create trigger measurements_updated_at
  before update on public.measurements
  for each row execute function public.set_updated_at();

alter table public.measurements enable row level security;

create policy "Lecture mesures" on public.measurements
  for select using (auth.uid() = user_id);

create policy "Insertion mesures" on public.measurements
  for insert with check (auth.uid() = user_id);

create policy "Modification mesures" on public.measurements
  for update using (auth.uid() = user_id);

create policy "Suppression mesures" on public.measurements
  for delete using (auth.uid() = user_id);
