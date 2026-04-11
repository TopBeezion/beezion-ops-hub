-- Add deliverables JSONB column and descripcion text to tasks
alter table tasks add column if not exists deliverables jsonb default '{}'::jsonb;
alter table tasks add column if not exists descripcion text;

-- Ensure realtime is enabled for key tables
-- (Run this manually in Supabase dashboard if needed:
--  Database → Replication → enable for 'tasks' table)
