# V2 ClickUp-like Schema — Migration Guide

Migration file: `004_v2_clickup_schema.sql`
Edge functions: `check-stale-tasks`, `recalc-priorities`
Status: **APPLIED** to production DB (`xxjlwwjvhvyadjllcxyy` — Beezion Knowledge Base) on 2026-04-14.

## What changes

1. **Etapas (8):** `copy`, `scripts`, `produccion`, `edicion`, `landing_page`, `lead_magnet`, `tracking`, `estructuracion`. Scripts and Copy are separate. Estructuración = Media Buying.
2. **Área (quién la hace):** `copy`, `produccion`, `edicion`, `trafico`, `tech`, `admin`. Auto-derived from etapa via trigger, but can be manually overridden.
3. **Status:** enum via CHECK constraint (todo, en_progreso, revision, bloqueado, hecho).
4. **Prioridad auto:** derived from `due_date` (baja >7d, media 4–7d, alta 1–3d, alerta_roja ≤0d). Flag `priority_manual_override` disables the trigger per-task.
5. **Revisión Final:** fields on `campaigns` (revision_final_done, revision_final_by, revision_final_at). Only `admin_plus` (Alec, Alejandro, Paula) can set them, enforced by trigger.
6. **Global view configs** (`view_configs` table): backlog/kanban view settings shared across users; personal views supported via `owner_id`.
7. **Task activity log** (`task_activity_log` table): AFTER INSERT/UPDATE/DELETE trigger on tasks writes a JSONB diff.
8. **Campaign templates** (`campaign_templates` table): applied via `apply_campaign_template(campaign_id)`. 4 defaults seeded: new_campaign, iteracion, refresh, bomberos.
9. **Views:** `campaign_progress` (% of hecho tasks) and `team_capacity` (load per team member, admin_plus only via RLS).

## How to apply (already done, here for the record / rollforward on branches)

```bash
# Using Supabase CLI on a local/branch DB:
supabase db push
# Or the migration file directly via psql / MCP apply_migration
```

The migration is **idempotent** — every ALTER, CREATE, CHECK uses `IF NOT EXISTS` / `DROP IF EXISTS` patterns.

## Edge functions deploy

```bash
supabase functions deploy check-stale-tasks
supabase functions deploy recalc-priorities
```

Schedule daily via `pg_cron`:

```sql
select cron.schedule(
  'recalc-priorities-daily', '0 5 * * *',
  $$ select net.http_post(
       url := 'https://xxjlwwjvhvyadjllcxyy.functions.supabase.co/recalc-priorities',
       headers := jsonb_build_object('Authorization','Bearer <anon-or-service-key>')
     ); $$
);

select cron.schedule(
  'check-stale-tasks-daily', '15 5 * * *',
  $$ select net.http_post(
       url := 'https://xxjlwwjvhvyadjllcxyy.functions.supabase.co/check-stale-tasks',
       headers := jsonb_build_object('Authorization','Bearer <anon-or-service-key>'),
       body := jsonb_build_object('days', 2)
     ); $$
);
```

## Smoke tests

```sql
-- 1) etapa enum check accepts new values
insert into tasks (title, etapa, client_id) values ('_smoke', 'scripts', (select id from clients limit 1));
select area from tasks where title = '_smoke'; -- expect 'copy'
delete from tasks where title = '_smoke';

-- 2) auto-priority
update tasks set due_date = now() + interval '2 days', priority_manual_override = false where id = <any>;
select priority from tasks where id = <any>; -- expect 'alta'

-- 3) revision final guard — fails unless session user is admin_plus
update campaigns set revision_final_done = true where id = <any>;

-- 4) stale tasks
select * from get_stale_tasks(2);

-- 5) campaign progress view
select * from campaign_progress limit 5;
```

## Rollback

The migration is additive — no destructive changes to existing columns. To back out:

```sql
-- drop new triggers
drop trigger if exists trg_auto_area_from_etapa on tasks;
drop trigger if exists trg_auto_priority on tasks;
drop trigger if exists trg_log_task_changes on tasks;
drop trigger if exists trg_revision_final_perm on campaigns;

-- drop new tables
drop table if exists task_activity_log cascade;
drop table if exists view_configs cascade;
drop table if exists campaign_templates cascade;

-- drop views and functions
drop view if exists campaign_progress;
drop view if exists team_capacity;
drop function if exists derive_area_from_etapa(text);
drop function if exists recalc_priorities_daily();
drop function if exists apply_campaign_template(uuid);
drop function if exists get_stale_tasks(integer);
drop function if exists is_admin_plus();

-- drop added columns
alter table tasks
  drop column if exists area,
  drop column if exists priority_manual_override;

alter table campaigns
  drop column if exists revision_final_done,
  drop column if exists revision_final_by,
  drop column if exists revision_final_at;
```

Existing data is preserved (241 tasks were migrated in place).
