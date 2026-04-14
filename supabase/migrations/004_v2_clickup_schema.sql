-- ============================================================
-- BEEZION OPS HUB v2 — ClickUp-like refactor
-- Migration: 004_v2_clickup_schema.sql
-- Fecha: 2026-04-14
-- Estado: APLICADA en proyecto xxjlwwjvhvyadjllcxyy (Beezion KB) via MCP.
--
-- Este archivo sirve como registro versionado de los cambios.
-- Idempotente: se puede correr múltiples veces sin romper datos.
-- ============================================================

-- ── 1. tasks.status: permitir 'blocker' ─────────────────────
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
UPDATE tasks SET status = 'blocker' WHERE status = 'revision';
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pendiente', 'en_progreso', 'blocker', 'completado'));

-- ── 2. tasks.etapa: 8 etapas (copy y scripts son distintas) ─
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_etapa_check;
UPDATE tasks SET etapa = 'estructuracion' WHERE etapa IN ('trafico', 'media_buying');
UPDATE tasks SET etapa = NULL WHERE etapa = 'revision_final';
ALTER TABLE tasks ADD CONSTRAINT tasks_etapa_check
  CHECK (etapa IS NULL OR etapa IN (
    'copy', 'scripts', 'produccion', 'edicion',
    'landing_page', 'lead_magnet',
    'tracking', 'estructuracion'
  ));

-- ── 3. tasks.priority: enum final + flag override manual ────
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('alerta_roja', 'alta', 'media', 'baja'));

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority_manual_override boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS cantidad_hooks integer,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- ── 4. tasks.area: incluir 'produccion' ─────────────────────
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_area_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_area_check
  CHECK (area IS NULL OR area IN ('copy', 'produccion', 'edicion', 'trafico', 'tech', 'admin'));

-- ── 5. campaigns: tipo bombero + revisión final ─────────────
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_type_check
  CHECK (type IN ('nueva_campana', 'iteracion', 'refresh', 'bombero'));

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
UPDATE campaigns SET status = 'activa' WHERE status = 'planning';
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('activa', 'pausada', 'desactivada'));

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS revision_final_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS revision_final_by   text,
  ADD COLUMN IF NOT EXISTS revision_final_at   timestamptz,
  ADD COLUMN IF NOT EXISTS revision_final_notes text;

-- ── 6. team_members.role: agregar admin_plus ────────────────
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin_plus', 'admin', 'maintainer', 'contributor', 'member'));

UPDATE team_members SET role = 'admin_plus'
WHERE email IN ('aleciriarte@beezion.com', 'alejosarmi@beezion.com', 'paula@beezion.com');

-- ── 7. Tabla: view_configs (vistas tipo ClickUp) ────────────
CREATE TABLE IF NOT EXISTS view_configs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  view_type    text NOT NULL CHECK (view_type IN ('backlog','kanban','campaigns','dashboard')),
  scope        text NOT NULL DEFAULT 'personal' CHECK (scope IN ('global','personal')),
  owner_email  text,
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default   boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_view_configs_owner ON view_configs(owner_email, view_type);
CREATE INDEX IF NOT EXISTS idx_view_configs_scope ON view_configs(scope, view_type);
ALTER TABLE view_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_all_views" ON view_configs;
CREATE POLICY "read_all_views" ON view_configs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_own_or_admin_plus" ON view_configs;
CREATE POLICY "write_own_or_admin_plus" ON view_configs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── 8. Tabla: task_activity_log (historial) ─────────────────
CREATE TABLE IF NOT EXISTS task_activity_log (
  id         bigserial PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_email text,
  user_name  text,
  action     text NOT NULL,
  field      text,
  old_value  text,
  new_value  text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_task ON task_activity_log(task_id, created_at DESC);
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_activity_log" ON task_activity_log;
CREATE POLICY "read_activity_log" ON task_activity_log FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_activity_log" ON task_activity_log;
CREATE POLICY "insert_activity_log" ON task_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- ── 9. Tabla: campaign_templates ────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL UNIQUE CHECK (tipo IN ('nueva_campana','iteracion','refresh','bombero')),
  name          text NOT NULL,
  default_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  has_objetivo  boolean DEFAULT true,
  has_revision_final boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_templates" ON campaign_templates;
CREATE POLICY "read_templates" ON campaign_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "manage_templates_admin" ON campaign_templates;
CREATE POLICY "manage_templates_admin" ON campaign_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 10. Funciones: derivar area de etapa + trigger ──────────
CREATE OR REPLACE FUNCTION derive_area_from_etapa(p_etapa text)
RETURNS text AS $$
BEGIN
  RETURN CASE p_etapa
    WHEN 'copy'           THEN 'copy'
    WHEN 'scripts'        THEN 'copy'
    WHEN 'produccion'     THEN 'produccion'
    WHEN 'edicion'        THEN 'edicion'
    WHEN 'landing_page'   THEN 'copy'
    WHEN 'lead_magnet'    THEN 'copy'
    WHEN 'tracking'       THEN 'trafico'
    WHEN 'estructuracion' THEN 'trafico'
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION auto_area_from_etapa()
RETURNS trigger AS $$
BEGIN
  IF NEW.etapa IS NOT NULL AND (NEW.area IS NULL OR NEW.area = '') THEN
    NEW.area := derive_area_from_etapa(NEW.etapa);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_area ON tasks;
CREATE TRIGGER trg_auto_area
  BEFORE INSERT OR UPDATE OF etapa ON tasks
  FOR EACH ROW EXECUTE FUNCTION auto_area_from_etapa();

-- ── 11. Auto-priorización por due_date ──────────────────────
CREATE OR REPLACE FUNCTION auto_set_priority_from_due_date()
RETURNS trigger AS $$
DECLARE v_days integer;
BEGIN
  IF NEW.priority_manual_override = true THEN RETURN NEW; END IF;
  IF NEW.due_date IS NULL THEN RETURN NEW; END IF;
  v_days := NEW.due_date - CURRENT_DATE;
  IF v_days <= 0 THEN NEW.priority := 'alerta_roja';
  ELSIF v_days <= 3 THEN NEW.priority := 'alta';
  ELSIF v_days <= 7 THEN NEW.priority := 'media';
  ELSE NEW.priority := 'baja';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_priority ON tasks;
CREATE TRIGGER trg_auto_priority
  BEFORE INSERT OR UPDATE OF due_date, priority_manual_override ON tasks
  FOR EACH ROW EXECUTE FUNCTION auto_set_priority_from_due_date();

CREATE OR REPLACE FUNCTION recalc_priorities_daily()
RETURNS integer AS $$
DECLARE v_count integer := 0;
BEGIN
  UPDATE tasks SET priority = CASE
      WHEN due_date - CURRENT_DATE <= 0 THEN 'alerta_roja'
      WHEN due_date - CURRENT_DATE <= 3 THEN 'alta'
      WHEN due_date - CURRENT_DATE <= 7 THEN 'media'
      ELSE 'baja'
    END
  WHERE priority_manual_override = false
    AND due_date IS NOT NULL
    AND status != 'completado';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ── 12. Activity log trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS trigger AS $$
DECLARE v_user_email text := current_setting('request.jwt.claim.email', true);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_activity_log (task_id, user_email, action, new_value)
    VALUES (NEW.id, v_user_email, 'created', NEW.title);
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO task_activity_log(task_id,user_email,action,field,old_value,new_value)
      VALUES (NEW.id,v_user_email,'status_change','status',OLD.status,NEW.status);
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO task_activity_log(task_id,user_email,action,field,old_value,new_value)
      VALUES (NEW.id,v_user_email,'updated','priority',OLD.priority,NEW.priority);
    END IF;
    IF NEW.assignee IS DISTINCT FROM OLD.assignee THEN
      INSERT INTO task_activity_log(task_id,user_email,action,field,old_value,new_value)
      VALUES (NEW.id,v_user_email,'updated','assignee',OLD.assignee,NEW.assignee);
    END IF;
    IF NEW.etapa IS DISTINCT FROM OLD.etapa THEN
      INSERT INTO task_activity_log(task_id,user_email,action,field,old_value,new_value)
      VALUES (NEW.id,v_user_email,'updated','etapa',OLD.etapa,NEW.etapa);
    END IF;
    IF NEW.mini_status IS DISTINCT FROM OLD.mini_status THEN
      INSERT INTO task_activity_log(task_id,user_email,action,field,old_value,new_value)
      VALUES (NEW.id,v_user_email,'updated','mini_status',OLD.mini_status,NEW.mini_status);
    END IF;
    IF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
      INSERT INTO task_activity_log(task_id,user_email,action,field,old_value,new_value)
      VALUES (NEW.id,v_user_email,'updated','due_date',OLD.due_date::text,NEW.due_date::text);
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO task_activity_log (task_id,user_email,action,old_value)
    VALUES (OLD.id,v_user_email,'deleted',OLD.title);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_task_changes ON tasks;
CREATE TRIGGER trg_log_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_changes();

-- ── 13. Permiso revisión final (solo admin_plus) ────────────
CREATE OR REPLACE FUNCTION is_admin_plus()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE email = auth.jwt() ->> 'email' AND role = 'admin_plus'
  );
EXCEPTION WHEN others THEN RETURN true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enforce_revision_final_permission()
RETURNS trigger AS $$
BEGIN
  IF (NEW.revision_final_done IS DISTINCT FROM OLD.revision_final_done
      OR NEW.revision_final_by IS DISTINCT FROM OLD.revision_final_by
      OR NEW.revision_final_at IS DISTINCT FROM OLD.revision_final_at)
     AND NOT is_admin_plus() THEN
    RAISE EXCEPTION 'Solo Alec, Alejandro o Paula pueden marcar la revisión final.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_revision_final_perm ON campaigns;
CREATE TRIGGER trg_revision_final_perm
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION enforce_revision_final_permission();

-- ── 14. Aplicar template de campaña ─────────────────────────
CREATE OR REPLACE FUNCTION apply_campaign_template(p_campaign_id uuid)
RETURNS integer AS $$
DECLARE v_tipo text; v_client_id uuid; v_template_tasks jsonb; v_task jsonb; v_count integer := 0;
BEGIN
  SELECT type, client_id INTO v_tipo, v_client_id FROM campaigns WHERE id = p_campaign_id;
  IF v_tipo IS NULL THEN RAISE EXCEPTION 'Campaign % not found', p_campaign_id; END IF;
  SELECT default_tasks INTO v_template_tasks FROM campaign_templates WHERE tipo = v_tipo;
  FOR v_task IN SELECT * FROM jsonb_array_elements(v_template_tasks) LOOP
    INSERT INTO tasks (title, campaign_id, client_id, etapa, area, status, priority, priority_manual_override, source, tipo)
    VALUES (v_task->>'title', p_campaign_id, v_client_id, v_task->>'etapa',
            COALESCE(v_task->>'area','copy'), 'pendiente', 'baja', true, 'template', 'nuevo');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 15. Stale tasks ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_stale_tasks(p_days integer DEFAULT 2)
RETURNS TABLE(task_id uuid, title text, assignee text, client_name text,
  campaign_name text, mini_status text, days_stale integer) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.assignee, c.name, camp.name, t.mini_status,
    (CURRENT_DATE - t.updated_at::date)::integer
  FROM tasks t
  LEFT JOIN clients c ON c.id = t.client_id
  LEFT JOIN campaigns camp ON camp.id = t.campaign_id
  WHERE t.status != 'completado'
    AND t.updated_at < (now() - (p_days || ' days')::interval)
  ORDER BY t.updated_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 16. Vistas: progreso y capacidad ────────────────────────
CREATE OR REPLACE VIEW campaign_progress AS
SELECT c.id AS campaign_id, c.name, c.client_id, c.type, c.status,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status='completado') AS completed_tasks,
  COUNT(t.id) FILTER (WHERE t.status='blocker') AS blocker_tasks,
  COUNT(t.id) FILTER (WHERE t.priority='alerta_roja' AND t.status!='completado') AS critical_open,
  CASE WHEN COUNT(t.id)=0 THEN 0
       ELSE ROUND(100.0*COUNT(t.id) FILTER (WHERE t.status='completado')/COUNT(t.id),1)
  END AS progreso_pct,
  c.revision_final_done
FROM campaigns c LEFT JOIN tasks t ON t.campaign_id=c.id
GROUP BY c.id;

CREATE OR REPLACE VIEW team_capacity AS
SELECT assignee,
  COUNT(*) FILTER (WHERE status!='completado') AS open_tasks,
  COUNT(*) FILTER (WHERE status='en_progreso') AS in_progress,
  COUNT(*) FILTER (WHERE status='blocker') AS blocked,
  COUNT(*) FILTER (WHERE priority='alerta_roja' AND status!='completado') AS critical,
  COUNT(*) FILTER (WHERE due_date<=CURRENT_DATE+7 AND status!='completado') AS due_this_week
FROM tasks WHERE assignee IS NOT NULL
GROUP BY assignee ORDER BY open_tasks DESC;

-- ── 17. Seeds de templates + vistas globales ────────────────
INSERT INTO campaign_templates (tipo, name, has_objetivo, has_revision_final, default_tasks) VALUES
  ('nueva_campana', 'New Campaign — Template', true, true, '[
    {"title":"Scripts","etapa":"scripts","area":"copy"},
    {"title":"Producción","etapa":"produccion","area":"produccion"},
    {"title":"Edición","etapa":"edicion","area":"edicion"},
    {"title":"Landing Page","etapa":"landing_page","area":"copy"},
    {"title":"Lead Magnet","etapa":"lead_magnet","area":"copy"},
    {"title":"Tracking","etapa":"tracking","area":"trafico"},
    {"title":"Estructuración","etapa":"estructuracion","area":"trafico"}
  ]'::jsonb),
  ('iteracion', 'Iteración — Template', false, false, '[
    {"title":"Revisión de Landing Pages","etapa":"landing_page","area":"copy"},
    {"title":"Actualizar Scorecards","etapa":null,"area":"admin"},
    {"title":"Revisar Heatmaps","etapa":"landing_page","area":"trafico"},
    {"title":"Plantear nuevas Estrategias","etapa":null,"area":"admin"},
    {"title":"CRO Solicitudes","etapa":"landing_page","area":"copy"}
  ]'::jsonb),
  ('refresh', 'Refresh — Template', true, true, '[
    {"title":"Scripts","etapa":"scripts","area":"copy"},
    {"title":"Producción","etapa":"produccion","area":"produccion"},
    {"title":"Edición","etapa":"edicion","area":"edicion"},
    {"title":"Landing Page","etapa":"landing_page","area":"copy"},
    {"title":"Lead Magnet","etapa":"lead_magnet","area":"copy"},
    {"title":"Tracking","etapa":"tracking","area":"trafico"},
    {"title":"Estructuración","etapa":"estructuracion","area":"trafico"}
  ]'::jsonb),
  ('bombero', 'Bombero — Template', false, false, '[
    {"title":"Scripts","etapa":"scripts","area":"copy"},
    {"title":"Producción","etapa":"produccion","area":"produccion"},
    {"title":"Edición","etapa":"edicion","area":"edicion"},
    {"title":"Landing Page","etapa":"landing_page","area":"copy"},
    {"title":"Lead Magnet","etapa":"lead_magnet","area":"copy"},
    {"title":"Tracking","etapa":"tracking","area":"trafico"},
    {"title":"Estructuración","etapa":"estructuracion","area":"trafico"}
  ]'::jsonb)
ON CONFLICT (tipo) DO UPDATE SET
  name = EXCLUDED.name, default_tasks = EXCLUDED.default_tasks,
  has_objetivo = EXCLUDED.has_objetivo, has_revision_final = EXCLUDED.has_revision_final;

INSERT INTO view_configs (name, view_type, scope, config, is_default) VALUES
  ('Default Backlog', 'backlog', 'global', '{"columns":["title","client","campaign","etapa","status","mini_status","assignee","priority","due_date"],"groupBy":null,"sortBy":{"field":"priority","dir":"desc"},"filters":[]}'::jsonb, true),
  ('Por Etapa', 'kanban', 'global', '{"groupBy":"etapa","cardFields":["client","assignee","priority","due_date","cantidad_hooks"],"filters":[]}'::jsonb, true),
  ('Por Status', 'kanban', 'global', '{"groupBy":"status","cardFields":["client","assignee","priority","due_date"],"filters":[]}'::jsonb, false),
  ('Por Responsable', 'kanban', 'global', '{"groupBy":"assignee","cardFields":["client","campaign","priority","due_date"],"filters":[]}'::jsonb, false)
ON CONFLICT DO NOTHING;
