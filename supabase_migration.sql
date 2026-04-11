-- ============================================================
-- BEEZION OPS HUB — Migration: Campaigns + Task Fields
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Crear tabla campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE CASCADE,
  type          text NOT NULL DEFAULT 'nueva_campana',
  -- 'nueva_campana' | 'iteracion' | 'refresh' | 'bombero'
  status        text NOT NULL DEFAULT 'activa',
  -- 'activa' | 'pausada' | 'desactivada'
  objective     text,
  launch_date   date,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. Agregar columnas nuevas a tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS campaign_id  uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS etapa        text,
  -- 'copy' | 'produccion' | 'edicion' | 'landing_page' | 'lead_magnet' | 'trafico' | 'revision_final'
  ADD COLUMN IF NOT EXISTS mini_status  text,
  -- 'aprobacion_interna' | 'correcciones' | 'enviado_cliente' | 'ajustes_cliente' | 'aprobado'
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS due_date     date;

-- 3. RLS para campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON campaigns;
CREATE POLICY "Authenticated users can manage campaigns" ON campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Limpiar clientes de prueba e insertar los reales de Beezion
-- (Solo ejecuta si quieres limpiar los clientes de test)
-- DELETE FROM tasks;       -- ⚠️ Borra tasks si quieres empezar limpio
-- DELETE FROM campaigns;   -- ⚠️ Borra campaigns
-- DELETE FROM clients;     -- ⚠️ Borra clientes

-- Insertar / actualizar los 6 clientes reales
INSERT INTO clients (name, color, active) VALUES
  ('Bink',               '#F59E0B', true),
  ('On The Fuze',        '#8B5CF6', true),
  ('Dapta',              '#3B82F6', true),
  ('Finkargo',           '#10B981', true),
  ('Treble',             '#EC4899', true),
  ('ColombiatechWeek',   '#F97316', true)
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color, active = true;

-- 5. Insertar campañas reales (ajusta client_id después de ver los UUIDs)
-- Para obtener los UUIDs: SELECT id, name FROM clients;
-- Luego reemplaza los valores de client_id abajo.

-- Ejemplo de seed de campañas (descomentar y ajustar UUIDs):
/*
DO $$
DECLARE
  bink_id uuid;
  fuze_id uuid;
  dapta_id uuid;
  finkargo_id uuid;
  treble_id uuid;
  ctw_id uuid;
BEGIN
  SELECT id INTO bink_id FROM clients WHERE name = 'Bink';
  SELECT id INTO fuze_id FROM clients WHERE name = 'On The Fuze';
  SELECT id INTO dapta_id FROM clients WHERE name = 'Dapta';
  SELECT id INTO finkargo_id FROM clients WHERE name = 'Finkargo';
  SELECT id INTO treble_id FROM clients WHERE name = 'Treble';
  SELECT id INTO ctw_id FROM clients WHERE name = 'ColombiatechWeek';

  INSERT INTO campaigns (name, client_id, type, status, objective) VALUES
    -- Bink
    ('Lead Magnet CFO',             bink_id,     'nueva_campana', 'activa',     'Capturar CFOs que no usan beneficios laborales'),
    ('Campañas Estacionalidad Q2',  bink_id,     'refresh',       'activa',     'Actualizar creativos por estacionalidad Q2'),

    -- On The Fuze
    ('Awareness Hooks',             fuze_id,     'nueva_campana', 'activa',     'Awareness general On The Fuze'),
    ('Lead Magnet 1',               fuze_id,     'nueva_campana', 'activa',     'Lead magnet principal'),
    ('Lead Magnet 2',               fuze_id,     'nueva_campana', 'activa',     'Lead magnet secundario'),
    ('BCL Hooks',                   fuze_id,     'iteracion',     'activa',     'Hooks para BCL prueba'),

    -- Dapta
    ('Awareness Dapta',             dapta_id,    'nueva_campana', 'activa',     'Campaña awareness Dapta'),
    ('Optimización Conversión',     dapta_id,    'iteracion',     'activa',     'CRO campaña principal'),

    -- Finkargo
    ('Awareness No Saben',          finkargo_id, 'nueva_campana', 'activa',     'Segmento no usa flex salarial - RR.HH.'),
    ('LM: 7 cosas que tu forwarder no muestra', finkargo_id, 'nueva_campana', 'activa', 'Lead magnet aprobado'),
    ('Calculadora Lead Magnet',     finkargo_id, 'nueva_campana', 'activa',     'Lead magnet calculadora'),
    ('Refresh Dotación',            finkargo_id, 'refresh',       'activa',     'Refresh campaña dotación activa'),

    -- Treble
    ('Lead Magnet Hotpot',          treble_id,   'nueva_campana', 'activa',     'Prueba lead magnet $500 inversión'),

    -- ColombiatechWeek
    ('LinkedIn Hooks',              ctw_id,      'nueva_campana', 'activa',     'Hooks LinkedIn CTW - grabar lunes'),
    ('Hooks Andrés Bilbao',         ctw_id,      'nueva_campana', 'activa',     'Hooks con Andrés Bilbao - siguiente semana'),
    ('Hooks Summit',                ctw_id,      'nueva_campana', 'activa',     'Hooks Summit - grabar miércoles');

END $$;
*/

-- ============================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que todo quedó bien
-- ============================================================
-- SELECT c.name as client, camp.name as campaign, camp.type, camp.status
-- FROM campaigns camp JOIN clients c ON c.id = camp.client_id
-- ORDER BY c.name, camp.name;
