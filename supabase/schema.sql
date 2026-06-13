-- Run this in the Supabase SQL editor.
-- Internal app with no auth: Row Level Security is intentionally left disabled.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  start_date date,
  capital_invested numeric default 0,
  revenue numeric default 0,
  cost_percentage numeric default 10,
  split_percentage numeric default 50,
  notes text,
  status text default 'active',
  funding_status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table projects
  add column if not exists funding_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_funding_status_check'
  ) then
    alter table projects
      add constraint projects_funding_status_check
      check (funding_status in ('full', 'partial') or funding_status is null);
  end if;
end $$;

-- Internal app with no auth: disable RLS so the anon key can read & write.
-- (Supabase enables RLS by default on tables created via the dashboard UI.)
alter table projects disable row level security;

-- Seed data from the client's "logistics - eli.xlsx" (10 projects, real figures).
insert into projects
  (project_name, start_date, capital_invested, revenue, cost_percentage, split_percentage, notes, funding_status)
values
  ('Air Oven',           '2026-01-08',  85800,  160000, 10, 50, '', 'full'),
  ('Air Oven 2',         '2026-03-03',  86000,  160000, 10, 50, '', 'full'),
  ('Trash Bags',         '2026-01-25', 260000,  480000, 10, 50, '', 'full'),
  ('Steel Wool',         '2026-02-06',  70000,  150000, 10, 50, '', 'full'),
  ('Bull Caps',          '2026-02-16', 305000,  585900, 10, 50, '', 'full'),
  ('Vinyl Stickers',     '2026-03-18', 378420,  710400, 10, 50, '', 'full'),
  ('Furniture',          '2026-03-18', 381700,  748000, 10, 50, '', 'full'),
  ('Dignity Advocacy',   '2026-04-15', 389800,  783800, 10, 50, '', 'full'),
  ('Surgical Equipment', '2026-05-15', 725000, 1554195, 10, 50, '', 'full'),
  ('Breast Moulds',      '2026-02-25',  96000,  179000, 10, 50, '', 'full');

update projects
set funding_status = 'partial'
where project_name = 'Probes'
  and funding_status is null;

update projects
set funding_status = 'full'
where project_name in (
  'Air Oven',
  'Air Oven 2',
  'Trash Bags',
  'Steel Wool',
  'Bull Caps',
  'Vinyl Stickers',
  'Furniture',
  'Dignity Advocacy',
  'Surgical Equipment',
  'Breast Moulds'
)
  and funding_status is null;

create table if not exists project_capital_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  amount numeric not null check (amount > 0),
  note text,
  updated_by text not null default '',
  created_at timestamp with time zone default now()
);

create index if not exists project_capital_entries_project_id_created_at_idx
  on project_capital_entries(project_id, created_at desc);

alter table project_capital_entries disable row level security;

create table if not exists project_audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  updated_by text not null default '',
  action text not null,
  details text not null,
  created_at timestamp with time zone default now()
);

create index if not exists project_audit_logs_project_id_created_at_idx
  on project_audit_logs(project_id, created_at desc);

alter table project_audit_logs disable row level security;
