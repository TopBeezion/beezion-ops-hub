-- ============================================================
-- FIX ETAPAS — Beezion Ops Hub
-- Ejecutar en Supabase SQL Editor
-- No toca tareas de área 'edicion' ni las de Alejandro
-- ============================================================

-- 1. LANDING PAGE — todo lo que diga LP / Copy LP / Landing Page
UPDATE tasks
SET etapa = 'landing_page'
WHERE (
    LOWER(title) LIKE '%landing page%'
 OR LOWER(title) LIKE '% lp %'
 OR LOWER(title) LIKE '%copy lp%'
 OR LOWER(title) LIKE '%crear lp%'
 OR LOWER(title) LIKE '%desarrollar lp%'
 OR LOWER(title) LIKE '%lp de %'
 OR LOWER(title) LIKE '%lp del %'
 OR LOWER(title) LIKE '%lp para %'
 OR LOWER(title) LIKE '% lp)'
 OR LOWER(title) LIKE '% lp,'
 OR title ILIKE '% LP'   -- termina en LP
)
AND area != 'edicion'
AND assignee != 'Alejandro';

-- 2. LEAD MAGNET — todo lo que diga LM / Lead Magnet
UPDATE tasks
SET etapa = 'lead_magnet'
WHERE (
    LOWER(title) LIKE '%lead magnet%'
 OR LOWER(title) LIKE '% lm %'
 OR LOWER(title) LIKE '%lm de %'
 OR LOWER(title) LIKE '%lm del %'
 OR LOWER(title) LIKE '%lm para %'
 OR LOWER(title) LIKE '% lm)'
 OR LOWER(title) LIKE '% lm,'
 OR title ILIKE '% LM'   -- termina en LM
)
AND area != 'edicion'
AND assignee != 'Alejandro'
AND etapa IS DISTINCT FROM 'landing_page';  -- no pisar lo que ya se fijó arriba

-- 3. PRODUCCION — grabar, footage, producir (NO "crear vsl" que es copy)
UPDATE tasks
SET etapa = 'produccion'
WHERE (
    LOWER(title) LIKE '%grabar%'
 OR LOWER(title) LIKE '%grabación%'
 OR LOWER(title) LIKE '%grabacion%'
 OR LOWER(title) LIKE '%footage%'
 OR LOWER(title) LIKE '%producir%'
 OR LOWER(title) LIKE '%producción%'
 OR LOWER(title) LIKE '%produccion%'
)
AND area != 'edicion'
AND assignee != 'Alejandro'
AND etapa IS DISTINCT FROM 'landing_page'
AND etapa IS DISTINCT FROM 'lead_magnet';

-- ============================================================
-- VERIFICACIÓN — Corre esto después para revisar los cambios
-- ============================================================
SELECT
  etapa,
  COUNT(*) AS total
FROM tasks
WHERE area != 'edicion'
  AND assignee != 'Alejandro'
GROUP BY etapa
ORDER BY total DESC;

-- Ver las tareas de LP para confirmar:
-- SELECT id, title, etapa, assignee FROM tasks WHERE etapa = 'landing_page' ORDER BY title;
-- Ver las de LM:
-- SELECT id, title, etapa, assignee FROM tasks WHERE etapa = 'lead_magnet' ORDER BY title;
-- Ver las de produccion:
-- SELECT id, title, etapa, assignee FROM tasks WHERE etapa = 'produccion' ORDER BY title;
