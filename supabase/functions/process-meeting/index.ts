import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface IncomingTask {
  title: string
  client_name?: string
  area: 'copy' | 'trafico' | 'tech' | 'admin'
  assignee: string
  priority?: 'alta' | 'media' | 'baja'
  week?: number
  tipo?: 'nuevo' | 'pendiente_anterior' | 'urgente'
  problema?: string
  descripcion?: string
  deliverables?: Record<string, number>
}

interface RequestBody {
  meeting_title?: string
  meeting_date?: string
  transcript?: string
  tasks?: IncomingTask[]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validate Authorization header
  const authHeader = req.headers.get('Authorization') ?? ''
  const apiKey = authHeader.replace('Bearer ', '')
  if (!apiKey.startsWith('eyJ')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing or invalid Authorization header' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body: RequestBody = await req.json()
    const { meeting_title, meeting_date, transcript, tasks = [] } = body

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tasks provided in payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Resolve client IDs by name
    const clientNames = [...new Set(tasks.map(t => t.client_name).filter(Boolean))] as string[]
    let clientMap: Record<string, string> = {}

    if (clientNames.length > 0) {
      const { data: clients } = await supabaseClient
        .from('clients')
        .select('id, name')
        .in('name', clientNames)

      if (clients) {
        clientMap = Object.fromEntries(
          (clients as { id: string; name: string }[]).map(c => [c.name, c.id])
        )
      }
    }

    // Build task rows
    const taskRows = tasks.map(task => ({
      title: task.title,
      client_id: task.client_name ? (clientMap[task.client_name] ?? null) : null,
      area: task.area,
      assignee: task.assignee,
      priority: task.priority ?? 'media',
      status: 'pendiente',
      week: task.week ?? 1,
      tipo: task.tipo ?? 'nuevo',
      problema: task.problema ?? null,
      descripcion: task.descripcion ?? task.problema ?? null,
      deliverables: task.deliverables ?? {},
      source: 'meeting_auto',
      meeting_date: meeting_date ?? null,
    }))

    const { data: insertedTasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .insert(taskRows)
      .select('id, title, area, assignee')

    if (tasksError) {
      console.error('Tasks insert error:', tasksError)
      throw new Error(tasksError.message)
    }

    // Log the meeting (non-fatal if meeting_logs table doesn't exist yet)
    try {
      await supabaseClient.from('meeting_logs').insert([{
        title: meeting_title ?? 'Reunión sin título',
        meeting_date: meeting_date ?? null,
        transcript: transcript ?? null,
        tasks_extracted: tasks.length,
        processed: true,
      }])
    } catch (logErr) {
      console.warn('meeting_logs insert warning:', logErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasks_created: insertedTasks?.length ?? tasks.length,
        tasks: insertedTasks ?? [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('process-meeting error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
