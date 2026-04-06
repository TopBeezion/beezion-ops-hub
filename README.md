# Beezion Ops Hub

Sistema de gestión operativa para la agencia de growth marketing Beezion.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4
- Supabase (auth + database + realtime)
- React Router v6
- TanStack React Query
- @dnd-kit (drag and drop en Kanban)

## Setup local

### 1. Instalar dependencias

npm install

### 2. Configurar variables de entorno

Copia `.env.example` a `.env.local` y reemplaza los valores:

cp .env.example .env.local

Edita `.env.local`:

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

Encuentra estas claves en Supabase → Settings → API.

### 3. Correr migraciones en Supabase

Opción A — Supabase CLI:

supabase db push

Opción B — Manual desde Supabase Dashboard:
1. Ir a SQL Editor en tu proyecto de Supabase
2. Ejecutar el contenido de `supabase/migrations/001_schema.sql`
3. Ejecutar el contenido de `supabase/migrations/002_seed.sql`

### 4. Invitar equipo a Supabase

En Supabase → Authentication → Users:
- Crear usuario con email para cada miembro del equipo
- O usar "Invite user" con su email

### 5. Iniciar servidor de desarrollo

npm run dev

## Deploy a Vercel

1. Conectar repositorio en vercel.com/new
2. En "Environment Variables" agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

## Edge Function — Webhook n8n

La función `process-meeting` recibe transcripciones de reuniones y crea tareas automáticamente.

### Deploy de la función

supabase functions deploy process-meeting

### Endpoint

POST https://{tu-proyecto}.supabase.co/functions/v1/process-meeting

### Headers

Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
Content-Type: application/json

### Body JSON

{
  "meeting_title": "Reunión semanal equipo",
  "meeting_date": "2025-04-07",
  "transcript": "Texto completo de la transcripción...",
  "tasks": [
    {
      "title": "Crear BCL para cliente X",
      "client_name": "Dapta",
      "area": "copy",
      "assignee": "Alejandro",
      "priority": "alta",
      "week": 1,
      "tipo": "nuevo",
      "problema": "Conversión baja en landing"
    }
  ]
}

### Respuesta

{ "success": true, "tasks_created": 5 }

### Configurar en n8n

1. Agrega un nodo HTTP Request
2. Método: POST
3. URL: el endpoint de arriba
4. Authentication: Header Auth → `Authorization: Bearer {SERVICE_KEY}`
5. Body: JSON con la estructura de arriba

## Estructura del proyecto

src/
  components/
    layout/     # Sidebar, Header, AppLayout
    tasks/      # TaskModal
    ui/         # Badge, AreaBadge, ClientBadge, StatusSelect, etc.
  hooks/        # useAuth, useTasks, useClients, useTeam, useTaskModal
  lib/          # supabase.ts, constants.ts
  pages/        # DashboardPage, BacklogPage, KanbanPage, TimelinePage, etc.
  types/        # index.ts (todos los tipos TypeScript)
supabase/
  migrations/   # 001_schema.sql, 002_seed.sql
  functions/
    process-meeting/  # Edge function para webhook n8n
