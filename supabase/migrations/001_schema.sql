-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Team members table
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text check (role in ('admin', 'maintainer', 'contributor')),
  color text
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references clients(id),
  area text check (area in ('copy', 'trafico', 'tech', 'admin')),
  assignee text,
  priority text check (priority in ('alta', 'media', 'baja')) default 'media',
  status text check (status in ('pendiente', 'en_progreso', 'revision', 'completado')) default 'pendiente',
  week integer check (week between 1 and 4) default 1,
  tipo text check (tipo in ('nuevo', 'pendiente_anterior', 'urgente')) default 'nuevo',
  problema text,
  source text default 'manual',
  meeting_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meeting logs table
create table if not exists meeting_logs (
  id uuid primary key default gen_random_uuid(),
  title text,
  meeting_date date,
  transcript text,
  tasks_extracted integer default 0,
  processed boolean default false,
  created_at timestamptz default now()
);

-- Auto-update updated_at trigger for tasks
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- Enable Row Level Security
alter table clients enable row level security;
alter table tasks enable row level security;
alter table team_members enable row level security;
alter table meeting_logs enable row level security;

-- RLS Policies: authenticated users can do everything
create policy "Authenticated users can read clients" on clients for select to authenticated using (true);
create policy "Authenticated users can insert clients" on clients for insert to authenticated with check (true);
create policy "Authenticated users can update clients" on clients for update to authenticated using (true);

create policy "Authenticated users can read tasks" on tasks for select to authenticated using (true);
create policy "Authenticated users can insert tasks" on tasks for insert to authenticated with check (true);
create policy "Authenticated users can update tasks" on tasks for update to authenticated using (true);
create policy "Authenticated users can delete tasks" on tasks for delete to authenticated using (true);

create policy "Authenticated users can read team_members" on team_members for select to authenticated using (true);
create policy "Authenticated users can manage team_members" on team_members for all to authenticated using (true);

create policy "Authenticated users can read meeting_logs" on meeting_logs for select to authenticated using (true);
create policy "Authenticated users can insert meeting_logs" on meeting_logs for insert to authenticated with check (true);
