-- ============================================================
-- Tasks Estrategia Clientes April01 — INSERT COMPLETO
-- 1. LP = landing_page, LM = lead_magnet
-- 2. Evita duplicados con ON CONFLICT DO NOTHING
-- ============================================================

-- ── DAPTA (35 tasks) ─────────────────────
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP Webinar Seguros', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP Campaña Hubspot', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar en Wordpress las LP de Webinar Seguros y Hubspot', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Caption para Webinar Seguros y Hubspot', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para Bookdemos (6 Hooks, 1 CTA, 1 Body)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para Registros LATAM (6 Hooks, 1 CTA, 1 Body) - Se usarían los mismos para España', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Quiz Interactivo para Dapta como Lead Magnet', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Script para Campaña de Quiz Interactivo (6 Hooks, 1 CTA, 1 Body)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP Quiz Interactivo', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar Landing Page en Wordpress de Quiz Interactivo', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Carrusel de Testimonios Escritos de Dapta para campaña de remarketing', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy y Desarrollar TYP de 50% Off luego de entregar LM de Dapta como Upsell', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Headline para Typeform donde mencionemos que crearán su primer agente en la llamada de Bookdemo (Aumentar Show Rate)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear y Desarrollar TYP Bookdemo (Dar urgencia y bono para conectarse al Demo)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear VSL para TYP Bookdemo (Específico de la necesidad que resuelve Dapta)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Colocar AI Interactiva en la LP de Bookdemo', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Organización y distribución del presupuesto para campañas de Seguros y Hubspot', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructuración de Campaña Webinar Seguros', 'trafico', 'Jose', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructuración de Campaña Hubspot', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Creación de UTM para Campaña Seguros', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Creación de UTM para Campaña Hubspot', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear o modificar eventos de conversión para campaña Webinar y Hubspot', 'trafico', 'Jose', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar con Aron el envío de correos de Follow Up para Webinar y llamadas con AI', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar reunión de preparación para Webinar con la mejora en el cierre de las ventas', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar con Fede el apoyo al webinar con Nico para que sea más conversacional', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Formulario en Typeform de Registro Webinar Seguros', 'trafico', 'Jose', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar oferta de Webinar Seguros y Webinar General', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Gestionar cómo embeber en LP de Registros el Webhook interactivo de hablar con la AI (Aumentar expectativa, dar urgencia: no puedes seguir hasta que te registres)', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear eventos de conversión en Google Tag que envíe a Google Ads cuando se registra un P1 y P2 como eventos primarios (lo mismo para Meta Ads)', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear campaña de Remarketing con porcentaje de reproducción con Ads de Awareness y de ingreso a landings específicas', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar Campaña de Lead Magnet como un Remarketing de personas que han interactuado en Dapta (reproducción de video) - Estas van después a TYP de Upsell o Popup de Tiempo', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Grabar anuncios Winners de Registros en formato horizontal para YouTube', 'edicion', 'Felipe', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Portada de LM Dapta', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear diseño del contenido del LM Dapta', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Editar contenido Webinar Seguros y Webinar General', 'edicion', 'David', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Dapta')
ON CONFLICT DO NOTHING;
-- ── BINK (21 tasks) ─────────────────────
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP Lead Magnet (Lo usan informal - flexibilización salarial legal)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP Lead Magnet (No usan o no saben qué es flexibilización - con enfoque de miedo/riesgo)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar LP de Lead Magnet (Lo usan informal - No saben o no usan)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear VSL para Landing Page inicial de Lead Magnet (Reforzar entendimiento de Bink)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear VSL para Thank You Page (Sí o sí, sin importar si es P1 o P2)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy y Headline de Thank You Page con urgencia diferenciada por ruta (P1: descuento si muestran Ploxy / P2: implementación gratis valorada en 500 USD)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Captions para campañas Bink', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Revisar y ajustar 16 hooks ya creados (los que entienden flexibilización pero no la usan + los que no entienden nada de flexibilización)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Carrusel de Testimonios escritos de Bink para campaña de remarketing/awareness', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar 6 campañas de Bink desglosadas por segmento (competidores, CFO usan informal, CFO no usan/no saben, awareness, etc.)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña de Awareness', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Configurar AdSets de remarketing dentro de las campañas existentes (segmentando por personas que ya vieron videos de Awareness)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Implementar nuevo formulario de calificación de leads', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Configurar agendamiento directo desde campañas para leads supremamente calificados (P1) hacia Thank You Page con booking de Alfredo', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Configurar push de la Calculadora al final del formulario de Lead Magnet (refuerzo post-conversión)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear eventos de conversión para nuevo formulario y agendamientos directos', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar con Miguel definición de urgencias/ofertas por ruta (P1 descuento, P2 implementación gratis)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Grabar videos para campaña de Awareness', 'edicion', 'Felipe', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Grabar VSL para Landing Page inicial de Lead Magnet', 'edicion', 'Felipe', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Grabar VSL para Thank You Page', 'edicion', 'Felipe', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Diseñar Carrusel de Testimonios escritos de Bink', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Bink')
ON CONFLICT DO NOTHING;
-- ── ON THE FUZE (28 tasks) ─────────────────────
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP de 3 Lead Magnets por Definir (Sales Audit, HubSpot Audit, Sales Checklist)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar las 3 LP de los Lead Magnets (Sales Audit, HubSpot Audit, Sales Checklist)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear contenido de los 3 Lead Magnets (Sales Audit, HubSpot Audit, Sales Checklist)', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy para Quiz Interactivo tipo ''What''s the ROI of your HubSpot'' como Lead Magnet adicional', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP del Quiz Interactivo', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar LP del Quiz Interactivo', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy de Thank You Page del Quiz con urgencia (7 de cada 10 personas ya dan el siguiente paso) y escasez (solo quedan 3 spots)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear nuevo Headline y Copy para Booking Page de On the Fuze (mejorar conversión)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear nuevo VSL para Booking Page de On the Fue', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campañas de los 3 Lead Magnets (6 Hooks, 1 CTA, 1 Body por cada Lead Magnet)', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña del Quiz Interactivo (6 Hooks, 1 CTA, 1 Body)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Awareness General (4 Hooks, 1 Body)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Awareness de Remarketing a visitantes de Landing Page (4 Hooks, 1 Body)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Carrusel de Testimonios escritos de On the Fuze para Awareness/Remarketing', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear copy para Display Ads de YouTube (aparecer en videos de Gabriel y videos relacionados a HubSpot)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campañas de los 3 Lead Magnets (Sales Audit, HubSpot Audit, Sales Checklist)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña del Quiz Interactivo como Lead Magnet adicional', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar 2 campañas de Awareness (1 general + 1 retargeting a visitantes de página/landing) - 2 videos por campaña', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña de Display Ads en YouTube (probar si aparecen en videos de Gabriel o solo en videos temáticos)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Implementar urgencia y escasez en Booking Page', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Reservar presupuesto en mayo para test de video estilo Wilson Luna que quiere hacer Gabriel', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Configurar tracking y eventos de conversión para nuevos Lead Magnets y Quiz', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar y distribuir presupuestos entre Lead Magnets, Quiz y Awareness', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Portadas de los 3 Lead Magnets (Sales Audit, HubSpot Audit, Sales Checklist)', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear diseño del contenido de los 3 Lead Magnets', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Portada y diseño de contenido del Quiz Interactivo Lead Magnet', 'edicion', 'David', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Diseñar Carrusel de Testimonios escritos de On the Fuze', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear assets gráficos para Display Ads de YouTube', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('On The Fuze')
ON CONFLICT DO NOTHING;
-- ── FINKARGO (26 tasks) ─────────────────────
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP Calculadora (Lead Magnet principal para importadores en Colombia y México)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar LP de Calculadora', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear contenido de Lead Magnet adicional diferente a la Calculadora (ebook, interactivo o anticipador de cambios de aduana/envío)', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy LP del Lead Magnet adicional', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Desarrollar LP del Lead Magnet adicional', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Calculadora (6 Hooks, 1 CTA, 1 Body) para Colombia y México', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña del Lead Magnet adicional (6 Hooks, 1 CTA, 1 Body)', 'copy', 'Alejandro', 'alta', 'pendiente', 'lead_magnet',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Webinar Finkargo (6 Hooks, 1 CTA, 1 Body)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Awareness General (4 Hooks, 1 Body)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Awareness con Testimonios de importadores (caso de logro de importar con ayuda de Finkargo)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy para campaña de Remarketing a FOPs calificados con oferta ''Hasta 3 millones de USD aprobados en 48 horas''', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Carrusel de Testimonios escritos de Finkargo (caso de importadores)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Copy de VSL para Thank You Page de Finkargo (estilo motion graphic dado el contexto B2B)', 'copy', 'Alejandro', 'alta', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Producir y montar el VSL ya aprobado de Finkargo (está aprobado pero no se ha producido)', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña de Calculadora para Colombia y México', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña del Lead Magnet adicional', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña de Webinar Finkargo', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar 2 campañas de Awareness (general + testimonios de importadores)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campaña exótica de Remarketing en Meta a FOPs calificados (lista constante de FOPs sincronizada con Meta)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Configurar sincronización entre lista de FOPs calificados y audiencia de Meta', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Validar con Laura si existen alertas de límite de crédito por agotar (en caso de no existir, proponer flujo de correos de apoyo)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar y distribuir presupuestos entre Calculadora, Lead Magnet adicional, Webinar y Awareness en Colombia y México', 'trafico', 'Alec', 'alta', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Producir VSL aprobado de Finkargo', 'edicion', 'Felipe', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear VSL para Thank You Page', 'edicion', 'Felipe', 'alta', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Diseñar Carrusel de Testimonios escritos de Finkargo', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Portada y diseño de contenido del Lead Magnet adicional (no Calculadora)', 'edicion', 'David', 'media', 'pendiente', 'produccion',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Finkargo')
ON CONFLICT DO NOTHING;
-- ── TREBLE (14 tasks) ─────────────────────
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear nuevos Headlines para Landing Page de Registros (mejorar tasa visita-click que está muy baja)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear nuevos Headlines para Landing Page de Talk to Sales', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear nuevos CTAs para Landing Pages de Registros y Talk to Sales', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Revisar y ajustar hooks ya adelantados por Ernest para Talk to Sales y Registros', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts completamente nuevos para campañas de Treble (6 Hooks, 1 CTA, 1 Body) - estilo diferente al actual, similar a metodología Dapta', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Awareness General de Treble (4 Hooks, 1 Body)', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Scripts para campaña de Awareness de Remarketing a visitantes de Landing Page (4 Hooks, 1 Body)', 'copy', 'Luisa', 'alta', 'pendiente', 'landing_page',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Crear Carrusel de Testimonios escritos de Treble para Awareness/Remarketing', 'copy', 'Luisa', 'media', 'pendiente', 'copy',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Rediseñar Landing Page de Registros (más moderna)', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Rediseñar Landing Page de Talk to Sales (más moderna)', 'trafico', 'Jose', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar 2 campañas de Awareness (general + retargeting a visitantes de página)', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Configurar tracking de eventos para medir mejora en tasa de visita-click post rediseño', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Estructurar campañas con meta ambiciosa de llegar a 1.000 MQLs solo en Paid', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (title, area, assignee, priority, status, etapa, client_id, week, tipo, source)
SELECT 'Coordinar y distribuir presupuestos entre Registros, Talk to Sales y Awareness', 'trafico', 'Alec', 'media', 'pendiente', 'trafico',
       c.id, 1, 'nuevo', 'manual'
FROM clients c WHERE LOWER(c.name) = LOWER('Treble')
ON CONFLICT DO NOTHING;

-- Total: 124 tasks insertadas