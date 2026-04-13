-- ============================================================
-- CAMBIOS ESTRUCTURALES - Beezion Ops Hub
-- Generado: 2026-04-13
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. NUEVA PRIORIDAD: alerta_roja
--    (si la columna priority tiene un CHECK constraint, hay que
--    actualizarlo. Si es TEXT libre, ya funciona sin cambios)
-- ────────────────────────────────────────────────────────────

-- Verificar si hay constraint en priority:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint WHERE conrelid = 'tasks'::regclass AND contype = 'c';

-- Si hay constraint de CHECK en priority, reemplazarlo:
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('alerta_roja', 'alta', 'media', 'baja'));

-- ────────────────────────────────────────────────────────────
-- 2. NUEVAS ETAPAS: tracking y media_buying
--    Igual, si hay CHECK constraint en etapa, actualizarlo
-- ────────────────────────────────────────────────────────────
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_etapa_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_etapa_check 
  CHECK (etapa IN ('copy','produccion','edicion','landing_page','lead_magnet',
                   'trafico','tracking','media_buying','revision_final'));

-- ────────────────────────────────────────────────────────────
-- 3. ACTUALIZAR ETAPAS de tareas existentes de Tráfico
--    → Las tareas de Tracking → etapa = 'tracking'
--    → Las tareas de Media Buying/Estructuración → etapa = 'media_buying'
-- ────────────────────────────────────────────────────────────

-- Tracking: tareas con UTM, eventos de conversión, pixel, Google Tag
UPDATE tasks SET etapa = 'tracking'
WHERE area = 'trafico'
  AND (
    title ILIKE '%utm%' OR
    title ILIKE '%evento%conversion%' OR
    title ILIKE '%tracking%' OR
    title ILIKE '%pixel%' OR
    title ILIKE '%google tag%' OR
    title ILIKE '%conversión%' OR
    title ILIKE '%eventos de%'
  )
  AND (etapa IS NULL OR etapa = 'trafico');

-- Media Buying: estructuración, presupuesto, distribución de campañas
UPDATE tasks SET etapa = 'media_buying'
WHERE area = 'trafico'
  AND (
    title ILIKE '%estructurar campa%' OR
    title ILIKE '%estructura%campa%' OR
    title ILIKE '%presupuesto%' OR
    title ILIKE '%distribuir%' OR
    title ILIKE '%distribución%' OR
    title ILIKE '%organización%presupuesto%'
  )
  AND (etapa IS NULL OR etapa = 'trafico');

-- ────────────────────────────────────────────────────────────
-- 4. ACTUALIZAR TÍTULOS DE TAREAS (más específicos del Excel)
--    Sólo actualiza si el título actual coincide (exact match)
-- ────────────────────────────────────────────────────────────

-- DAPTA - Copy
UPDATE tasks SET title = 'Crear Copy LP Webinar Seguros', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%copy lp webinar seguros%';

UPDATE tasks SET title = 'Crear Copy LP Campaña Hubspot', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%copy lp%hubspot%';

UPDATE tasks SET title = 'Desarrollar en Wordpress LP de Webinar Seguros y Hubspot', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%desarrollar%wordpress%lp%' OR title ILIKE '%wordpress%webinar%';

UPDATE tasks SET title = 'Crear Scripts para Book Demos — 6 Hooks, 1 CTA, 1 Body', etapa = 'copy'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND (title ILIKE '%scripts%bookdemo%' OR title ILIKE '%scripts%book demo%');

UPDATE tasks SET title = 'Crear Scripts para Registros LATAM — 6 Hooks, 1 CTA, 1 Body (mismos para España)', etapa = 'copy'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%scripts%registros%latam%';

UPDATE tasks SET title = 'Crear TYP 50% Off + Upsell post Lead Magnet Dapta', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND (title ILIKE '%typ%50%' OR title ILIKE '%thank you%50%' OR title ILIKE '%upsell%lm%');

UPDATE tasks SET title = 'Crear y Desarrollar TYP Book Demo — urgencia y bono para conectarse al Demo', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND (title ILIKE '%typ bookdemo%' OR title ILIKE '%typ book demo%' OR title ILIKE '%typage book%');

UPDATE tasks SET title = 'Crear VSL para TYP Book Demo — específico de la necesidad que resuelve Dapta', etapa = 'produccion'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%vsl%typ%bookdemo%' OR title ILIKE '%vsl%typ book demo%';

UPDATE tasks SET title = 'Organización y distribución del presupuesto para campañas de Seguros y Hubspot', etapa = 'media_buying'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%organización%presupuesto%';

UPDATE tasks SET title = 'Estructuración de Campaña Webinar Seguros', etapa = 'media_buying'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%estructuraci%campa%webinar%' AND title ILIKE '%seguros%';

UPDATE tasks SET title = 'Estructurar Campaña de Lead Magnet (remarketing personas que han interactuado en Dapta)', etapa = 'media_buying'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%dapta%' LIMIT 1)
  AND title ILIKE '%campa%lead magnet%remarketing%';

-- TREBLE - Copy (títulos más específicos)
UPDATE tasks SET title = 'Crear nuevos Headlines para LP de Registros — mejorar tasa visita-click (muy baja)', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%treble%' LIMIT 1)
  AND title ILIKE '%headline%lp%registros%' OR title ILIKE '%headlines%landing%registros%';

UPDATE tasks SET title = 'Crear nuevos Headlines para LP de Talk to Sales', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%treble%' LIMIT 1)
  AND title ILIKE '%headline%lp%talk%sales%' OR title ILIKE '%headlines%landing%talk%sales%';

UPDATE tasks SET title = 'Crear Scripts nuevos para Treble — 6 Hooks, 1 CTA, 1 Body (estilo diferente, similar a metodología Dapta)', etapa = 'copy'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%treble%' LIMIT 1)
  AND title ILIKE '%scripts%treble%' AND (title ILIKE '%6 hooks%' OR title ILIKE '%nuevo%');

-- FINKARGO - Copy
UPDATE tasks SET title = 'Crear Copy LP Calculadora — Lead Magnet principal para importadores en Colombia y México', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%finkargo%' LIMIT 1)
  AND title ILIKE '%copy lp%calculadora%' OR title ILIKE '%lp calculadora%';

UPDATE tasks SET title = 'Crear Scripts campaña Calculadora — 6 Hooks, 1 CTA, 1 Body para Colombia y México', etapa = 'copy'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%finkargo%' LIMIT 1)
  AND title ILIKE '%scripts%calculadora%';

-- BINK - Copy
UPDATE tasks SET title = 'Crear Copy LP Lead Magnet — Perfil: usan flexibilización salarial informal', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%bink%' LIMIT 1)
  AND title ILIKE '%copy lp%lead magnet%informal%';

UPDATE tasks SET title = 'Crear Copy LP Lead Magnet — Perfil: no usan o no saben qué es flexibilización (enfoque riesgo/miedo)', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%bink%' LIMIT 1)
  AND title ILIKE '%copy lp%lead magnet%' AND (title ILIKE '%no usan%' OR title ILIKE '%miedo%' OR title ILIKE '%riesgo%');

-- OTF - Copy
UPDATE tasks SET title = 'Crear Copy LP de 3 Lead Magnets (Sales Audit, HubSpot Audit, Sales Checklist)', etapa = 'landing_page'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%fuze%' OR name ILIKE '%otf%' LIMIT 1)
  AND title ILIKE '%copy lp%lead magnet%' AND title ILIKE '%audit%';

UPDATE tasks SET title = 'Crear Copy para Quiz Interactivo ''What''s the ROI of your HubSpot'' — Lead Magnet adicional', etapa = 'copy'
WHERE client_id = (SELECT id FROM clients WHERE name ILIKE '%fuze%' OR name ILIKE '%otf%' LIMIT 1)
  AND title ILIKE '%quiz%' AND (title ILIKE '%roi%' OR title ILIKE '%interactivo%');

-- ────────────────────────────────────────────────────────────
-- 5. INSERTAR NUEVAS TAREAS DE SCRIPTS (del Excel Scripts_Estrategia)
--    Estas son tareas específicas de producción de scripts
-- ────────────────────────────────────────────────────────────

-- Obtener IDs de clientes (necesario para el INSERT)
-- Primero verifiquemos los IDs:
-- SELECT id, name FROM clients;

-- INSERT de scripts tasks (usando subqueries para client_id dinámico)
INSERT INTO tasks (title, area, assignee, priority, status, etapa, week, tipo, source, created_at, updated_at, client_id)
SELECT t.title, t.area, t.assignee, t.priority, t.status, t.etapa, t.week, t.tipo, t.source, NOW(), NOW(), c.id
FROM (VALUES
  -- DAPTA Scripts
  ('Scripts Awareness — Información general de Dapta (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Dapta'),
  ('Scripts Awareness Remarketing — Importancia de registrarse en Dapta (personas que no se registraron o abandonaron un step) — 3 Hooks, 1 Body', 'copy', 'Alejandro', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Dapta'),
  ('Scripts Awareness Remarketing — Para personas que agendaron Book Demo (aumentar show rate) — 3 Hooks, 1 Body', 'copy', 'TBD', 'media', 'pendiente', 'copy', 4, 'nuevo', 'scripts_excel', 'Dapta'),
  ('Scripts Book Demo — Énfasis en recibir primer agente gratis al comprar Dapta (incluir condiciones) — 6 Hooks, 1 CTA, 1 Body', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Dapta'),
  ('Scripts Payment Approved 50% Off para Estados Unidos — opción: traducir winners de LATAM — 3 Hooks, 1 CTA, 1 Body', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Dapta'),
  -- TREBLE Scripts
  ('Copy anuncios estáticos — 4 imágenes Talk To Sales + 4 imágenes Registros (8 copys)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Treble'),
  ('Copy anuncios estáticos para LM HubSpot que quiere promocionar Matheus (TBD)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Treble'),
  ('3 Headlines diferentes para A/B testing en landing pages — aumentar conversión', 'copy', 'Alejandro', 'media', 'pendiente', 'landing_page', 3, 'nuevo', 'scripts_excel', 'Treble'),
  ('Mejorar copy de CTA de landing page de Registros y Talk To Sales', 'copy', 'TBD', 'media', 'pendiente', 'landing_page', 2, 'nuevo', 'scripts_excel', 'Treble'),
  -- FINKARGO Scripts
  ('Crear 5 títulos de Lead Magnet enfocados en lo que ofrece Finkargo', 'copy', 'Alejandro', 'alta', 'completado', 'lead_magnet', 2, 'nuevo', 'scripts_excel', 'Finkargo'),
  ('Scripts Awareness — Información general de lo que es Finkargo (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Finkargo'),
  ('Scripts Awareness Remarketing — Info específica para importadores calificados (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Finkargo'),
  ('Scripts Paga Directo — 3 ángulos de dolor diferentes (9 Hooks total) para encontrar mejor ángulo', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Finkargo'),
  ('Scripts LM Calculadora de costos para importadores — 4 Hooks, 1 CTA, 1 Body', 'copy', 'Alejandro', 'media', 'pendiente', 'copy', 3, 'nuevo', 'scripts_excel', 'Finkargo'),
  ('Scripts LM según título escogido (post-aprobación) — 4 Hooks, 1 CTA, 1 Body', 'copy', 'Alejandro', 'media', 'pendiente', 'copy', 3, 'nuevo', 'scripts_excel', 'Finkargo'),
  ('Scripts Refresh para Brokers — 4 Hooks, 1 CTA', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Finkargo'),
  -- BINK Scripts
  ('Scripts Awareness — Información general de lo que es Bink (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 3, 'nuevo', 'scripts_excel', 'Bink'),
  ('Scripts Awareness Remarketing — Info específica para personas calificadas (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'Bink'),
  -- OTF Scripts
  ('Scripts Awareness — Información general de lo que es OTF (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 3, 'nuevo', 'scripts_excel', 'OTF'),
  ('Scripts Awareness Remarketing — Info específica para leads calificados (4 Hooks, 1 Body)', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'OTF'),
  ('Crear 5 títulos de Lead Magnet basándose en el winner de Audit Checklist', 'copy', 'Alejandro', 'media', 'pendiente', 'lead_magnet', 3, 'nuevo', 'scripts_excel', 'OTF'),
  ('Scripts LM según título aprobado — 6 Hooks, 1 CTA, 1 Body', 'copy', 'TBD', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'OTF'),
  -- CTW Scripts
  ('Scripts Conversión Bilbaos — Muy ''profesionales'' — 10 Hooks, 2 CTA', 'copy', 'Alejandro', 'alta', 'completado', 'copy', 1, 'nuevo', 'scripts_excel', 'CTW'),
  ('Scripts Conversión S3-S4 — 10 Hooks, 2 CTA, 1 Body', 'copy', 'Alejandro', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'CTW'),
  ('Crear 3 Títulos de Webinar para Colombia Tech Week (Claude)', 'copy', 'Alejandro', 'media', 'pendiente', 'copy', 2, 'nuevo', 'scripts_excel', 'CTW'),
  ('Carruseles e Imágenes — 10 variaciones de estáticos (Speakers, Marcas, Ofertas, etc.) — CRUCIAL', 'copy', 'TBD', 'alta', 'pendiente', 'copy', 1, 'nuevo', 'scripts_excel', 'CTW')
) AS t(title, area, assignee, priority, status, etapa, week, tipo, source, client_name)
JOIN clients c ON c.name ILIKE t.client_name OR 
  (t.client_name = 'OTF' AND c.name ILIKE '%fuze%') OR
  (t.client_name = 'CTW' AND c.name ILIKE '%colombia%')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. INSERTAR NUEVAS TAREAS de TRÁFICO con etapas correctas
--    (del Excel Tasks April01 - sección Tráfico)
-- ────────────────────────────────────────────────────────────

INSERT INTO tasks (title, area, assignee, priority, status, etapa, week, tipo, source, created_at, updated_at, client_id)
SELECT t.title, t.area, t.assignee, t.priority, t.status, t.etapa, t.week, t.tipo, t.source, NOW(), NOW(), c.id
FROM (VALUES
  -- DAPTA Tráfico - Tracking
  ('Creación de UTM para Campaña Seguros', 'trafico', 'Alec', 'media', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Creación de UTM para Campaña Hubspot', 'trafico', 'Alec', 'media', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Crear o modificar eventos de conversión para campaña Webinar y Hubspot', 'trafico', 'Alec', 'media', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Crear eventos de conversión en Google Tag — P1/P2 como eventos primarios en Google Ads y Meta Ads', 'trafico', 'Alec', 'alta', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Dapta'),
  -- DAPTA Tráfico - Media Buying
  ('Organización y distribución del presupuesto para campañas de Seguros y Hubspot', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 1, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Estructuración de Campaña Webinar Seguros', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 1, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Estructuración de Campaña Hubspot', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 1, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Crear Formulario en Typeform de Registro Webinar Seguros', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 1, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Estructurar Campaña de Lead Magnet (remarketing personas que han interactuado en Dapta)', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 2, 'nuevo', 'tasks_excel', 'Dapta'),
  ('Crear campaña de Remarketing con porcentaje de reproducción (Awareness + ingreso a landing)', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 3, 'nuevo', 'tasks_excel', 'Dapta'),
  -- BINK Tráfico
  ('Estructurar 6 campañas de Bink por segmento (competidores, CFO informal, CFO no usan, awareness, etc.)', 'trafico', 'Alec', 'alta', 'pendiente', 'media_buying', 2, 'nuevo', 'tasks_excel', 'Bink'),
  ('Configurar AdSets de remarketing dentro de campañas existentes (personas que vieron videos de Awareness)', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 2, 'nuevo', 'tasks_excel', 'Bink'),
  ('Implementar nuevo formulario de calificación de leads', 'trafico', 'Alec', 'alta', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Bink'),
  ('Configurar agendamiento directo desde campañas para leads P1 → TYP con booking de Alfredo', 'trafico', 'Alec', 'alta', 'pendiente', 'media_buying', 2, 'nuevo', 'tasks_excel', 'Bink'),
  ('Crear eventos de conversión para nuevo formulario y agendamientos directos', 'trafico', 'Alec', 'media', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Bink'),
  -- OTF Tráfico
  ('Estructurar campañas de 3 Lead Magnets (Sales Audit, HubSpot Audit, Sales Checklist)', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 3, 'nuevo', 'tasks_excel', 'OTF'),
  ('Configurar tracking y eventos de conversión para nuevos Lead Magnets y Quiz', 'trafico', 'Alec', 'media', 'pendiente', 'tracking', 3, 'nuevo', 'tasks_excel', 'OTF'),
  ('Coordinar y distribuir presupuestos entre Lead Magnets, Quiz y Awareness', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 3, 'nuevo', 'tasks_excel', 'OTF'),
  -- FINKARGO Tráfico
  ('Estructurar campaña de Calculadora para Colombia y México', 'trafico', 'Alec', 'media', 'pendiente', 'media_buying', 2, 'nuevo', 'tasks_excel', 'Finkargo'),
  ('Estructurar campaña exótica de Remarketing en Meta a FOPs calificados (lista sincronizada con Meta)', 'trafico', 'Alec', 'alta', 'pendiente', 'media_buying', 3, 'nuevo', 'tasks_excel', 'Finkargo'),
  ('Configurar sincronización entre lista de FOPs calificados y audiencia de Meta', 'trafico', 'Alec', 'alta', 'pendiente', 'tracking', 3, 'nuevo', 'tasks_excel', 'Finkargo'),
  -- TREBLE Tráfico
  ('Rediseñar Landing Page de Registros Treble (más moderna)', 'trafico', 'Alec', 'alta', 'pendiente', 'landing_page', 2, 'nuevo', 'tasks_excel', 'Treble'),
  ('Configurar tracking de eventos para medir mejora en tasa de visita-click post rediseño', 'trafico', 'Alec', 'media', 'pendiente', 'tracking', 2, 'nuevo', 'tasks_excel', 'Treble'),
  ('Estructurar campañas con meta ambiciosa de llegar a 1.000 MQLs solo en Paid', 'trafico', 'Alec', 'alta', 'pendiente', 'media_buying', 3, 'nuevo', 'tasks_excel', 'Treble')
) AS t(title, area, assignee, priority, status, etapa, week, tipo, source, client_name)
JOIN clients c ON c.name ILIKE t.client_name OR 
  (t.client_name = 'OTF' AND c.name ILIKE '%fuze%') OR
  (t.client_name = 'CTW' AND c.name ILIKE '%colombia%')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 7. VERIFICACIÓN
-- ────────────────────────────────────────────────────────────
SELECT etapa, count(*) 
FROM tasks 
GROUP BY etapa 
ORDER BY etapa;

SELECT priority, count(*) 
FROM tasks 
GROUP BY priority 
ORDER BY priority;

