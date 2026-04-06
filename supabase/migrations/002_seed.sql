-- Seed clients
insert into clients (name, color) values
  ('Dapta', '#818cf8'),
  ('Bink', '#f472b6'),
  ('On The Fuse', '#4ade80'),
  ('Fincargo', '#fbbf24'),
  ('Trevol', '#60a5fa'),
  ('Colombia Tech Week', '#f87171');

-- Seed team members
insert into team_members (name, role, color) values
  ('Alejandro', 'admin', '#fbbf24'),
  ('Alec', 'maintainer', '#818cf8'),
  ('Paula', 'contributor', '#f472b6'),
  ('Jose Luis', 'contributor', '#4ade80');

-- Seed tasks for Dapta
insert into tasks (title, client_id, area, assignee, priority, status, week, tipo, problema)
select
  title,
  (select id from clients where name = 'Dapta'),
  area::text,
  assignee,
  priority::text,
  'pendiente'::text,
  week,
  tipo::text,
  problema
from (values
  ('Scripts 3 videos remarketing funnel (lead magnet, awareness producto, testimonios carrusel)', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Payment Approved conversión baja'),
  ('Copy Thank You Page con oferta 50% off — upsell al descargar lead magnet', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Payment Approved conversión baja'),
  ('Configurar evento conversión P1/P2 como prioridad en Google Ads', 'trafico', 'Alec', 'alta', 1, 'nuevo', 'Pocos registros P1/P2'),
  ('Exportar lista P1/P2 desde HubSpot y subir a Meta como audiencia + lookalike', 'trafico', 'Alec', 'alta', 1, 'nuevo', 'Pocos registros P1/P2'),
  ('Análisis qué campañas traen más P1/P2 — desktop vs mobile', 'trafico', 'Alec', 'media', 1, 'nuevo', 'Pocos registros P1/P2'),
  ('Rediseñar landing Book Demo: fricción + VSL + urgencia + escasez (primeros 20 spots)', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Show rate Book Demos menor al 50%'),
  ('Copy oferta primer agente gratis en booking page', 'copy', 'Alejandro', 'media', 2, 'nuevo', 'Show rate Book Demos bajo'),
  ('Integrar AI voice call (Talk to Dapta) en landing de registros para calentar leads', 'tech', 'Alec', 'media', 2, 'nuevo', 'Show rate Book Demos bajo')
) as t(title, area, assignee, priority, week, tipo, problema);

-- Seed tasks for Bink
insert into tasks (title, client_id, area, assignee, priority, status, week, tipo, problema)
select
  title,
  (select id from clients where name = 'Bink'),
  area::text,
  assignee,
  priority::text,
  'pendiente'::text,
  week,
  tipo::text,
  problema
from (values
  ('Revisar y ajustar 16 hooks existentes enviados por Alec', 'copy', 'Alejandro', 'alta', 1, 'pendiente_anterior', 'Volumen MQLs bajo'),
  ('Captions CFO1 — usa flexibilización informal, mensaje: riesgo legal + cómo hacerlo bien', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Volumen MQLs bajo'),
  ('Captions CFO2 — no sabe qué es flexibilización, mensaje educativo', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Volumen MQLs bajo'),
  ('Scripts 4 videos awareness + 2 videos retargeting por VTR (25%, 50%, 75%)', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Volumen MQLs bajo'),
  ('Diseñar y subir nuevo formulario de calificación con preguntas más específicas', 'tech', 'Alec', 'alta', 1, 'nuevo', 'Calificación MQL a SQL baja'),
  ('Crear BCL para landing pages de Bink', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Calificación MQL a SQL baja'),
  ('Copy Thank You Page con urgencia y escasez — confirmar oferta específica con Miguel', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Calificación MQL a SQL baja'),
  ('Estructurar campañas: CFO1, CFO2, Competidores calculadora, Awareness + retargeting VTR', 'trafico', 'Alec', 'alta', 1, 'nuevo', 'Calificación MQL a SQL baja'),
  ('Lead magnet CFO1: guía cómo hacer flexibilización salarial legal', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Volumen MQLs bajo'),
  ('Lead magnet CFO2: qué es la flexibilización salarial y por qué la necesitas', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Volumen MQLs bajo')
) as t(title, area, assignee, priority, week, tipo, problema);

-- Seed tasks for On The Fuse
insert into tasks (title, client_id, area, assignee, priority, status, week, tipo, problema)
select
  title,
  (select id from clients where name = 'On The Fuse'),
  area::text,
  assignee,
  priority::text,
  'pendiente'::text,
  week,
  tipo::text,
  problema
from (values
  ('Lead magnet: HubSpot Sales Audit — checklist descargable', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Semanas irregulares de MQLs'),
  ('Lead magnet: HubSpot Implementation Checklist', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Semanas irregulares de MQLs'),
  ('Lead magnet: Sales Process Checklist', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Semanas irregulares de MQLs'),
  ('Quiz funnel: What''s the ROI of your HubSpot + Thank You Page con urgencia', 'copy', 'Alejandro', 'media', 2, 'nuevo', 'Semanas irregulares de MQLs'),
  ('Actualizar booking page: nuevo BCL + urgencia estadística + escasez (X spots disponibles)', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Pocos bookings'),
  ('Testear YouTube display ads en videos del canal On The Fuse', 'trafico', 'Alec', 'media', 2, 'nuevo', 'Pocos bookings'),
  ('Lanzar campaña awareness + retargeting (visitó landing pero no descargó)', 'trafico', 'Alec', 'alta', 1, 'nuevo', 'Costo por MQL alto'),
  ('Reservar presupuesto para test video estilo Wilson Luna con Gabriel — Mayo', 'admin', 'Alec', 'baja', 4, 'nuevo', 'Estrategia Mayo')
) as t(title, area, assignee, priority, week, tipo, problema);

-- Seed tasks for Fincargo
insert into tasks (title, client_id, area, assignee, priority, status, week, tipo, problema)
select
  title,
  (select id from clients where name = 'Fincargo'),
  area::text,
  assignee,
  priority::text,
  'pendiente'::text,
  week,
  tipo::text,
  problema
from (values
  ('Producir BCL Fincargo (ya aprobado) y subir a Thank You Page', 'copy', 'Paula', 'alta', 1, 'pendiente_anterior', 'MQLs bajos Colombia y México'),
  ('Crear lead magnet: Calculadora de costos para importadores', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'MQLs bajos Colombia y México'),
  ('Configurar lista FOB calificados en Meta y lanzar campaña remarketing', 'trafico', 'Alec', 'alta', 2, 'nuevo', 'Baja conversión FOB a pitch'),
  ('Copy anuncio remarketing FOB: aprobamos hasta 3M en 48 horas — solo esta semana', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Baja conversión FOB a pitch'),
  ('Implementar alertas automáticas cuando crédito de cliente está próximo a vencer', 'tech', 'Alec', 'media', 2, 'nuevo', 'Retención y activación'),
  ('Crear template de reporte quincenal de performance para Fincargo', 'admin', 'Alec', 'media', 1, 'nuevo', 'Comunicación con cliente'),
  ('Crear carrusel testimonios escritos de importadores', 'copy', 'Paula', 'media', 2, 'nuevo', 'MQLs bajos'),
  ('Pedir métricas de contactabilidad a Figueroa — FOB contactados vs respondidos', 'admin', 'Alec', 'alta', 1, 'urgente', 'Datos faltantes'),
  ('Preparar presentación Fincargo: Q1 resultados vs expectativas + cuello de botella + estrategia Abril y Q2', 'admin', 'Alec', 'alta', 1, 'urgente', 'Reunión con cliente')
) as t(title, area, assignee, priority, week, tipo, problema);

-- Seed tasks for Trevol
insert into tasks (title, client_id, area, assignee, priority, status, week, tipo, problema)
select
  title,
  (select id from clients where name = 'Trevol'),
  area::text,
  assignee,
  priority::text,
  'pendiente'::text,
  week,
  tipo::text,
  problema
from (values
  ('Enviar propuestas headlines landing + anuncios a Alejandro para revisión', 'copy', 'Alec', 'alta', 1, 'pendiente_anterior', 'Conversión visita a click baja'),
  ('Escribir nuevos hooks ads Talk to Sale y Registros — enfoque completamente diferente al actual', 'copy', 'Alejandro', 'alta', 1, 'nuevo', 'Meta 1000 MQLs desde paid'),
  ('Estructurar campaña awareness transversal', 'trafico', 'Alec', 'media', 2, 'nuevo', 'Meta 1000 MQLs desde paid'),
  ('Auditar landing page: diseño, contraste, CTA, modernidad — proponer mejoras', 'trafico', 'Alec', 'alta', 1, 'nuevo', 'Conversión visita a click baja')
) as t(title, area, assignee, priority, week, tipo, problema);
