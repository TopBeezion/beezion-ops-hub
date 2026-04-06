import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body: RequestBody = await req.json()
    const { meeting_title, meeting_date, transcript, tasks = [] } = body

    // Resolve client IDs by name
    const clientNames = [...new Set(tasks.map(t => t.client_name).filter(Boolean))]
    let clientMap: Record<string, string> = {}

    if (clientNames.length > 0) {
      const { data: clients } = await supabaseClient
        .from('clients')
        .select('id, name')
        .in('name', clientNames)

      if (clients) {
        clientMap = Object.fromEntries(clients.map(c => [c.name, c.id]))
      }
    }

    // Insert tasks
    const taskRows = tasks.map(task => ({
      title: task.title,
      client_id: task.client_name ? clientMap[task.client_name] : null,
      area: task.area,
      assignee: task.assignee,
      priority: task.priority ?? 'media',
      status: 'pendiente',
      week: task.week ?? 1,
      tipo: task.tipo ?? 'nuevo',
      problema: task.problema ?? null,
      source: 'meeting_auto',
      meeting_date: meeting_date ?? null,
    }))

    const { error: tasksError } = await supabaseClient.from('tasks').insert(taskRows)
    if (tasksError) throw tasksError

    // Insert meeting log
    const { error: meetingError } = await supabaseClient.from('meeting_logs').insert([{
      title: meeting_title ?? 'Reunión sin título',
      meeting_date: meeting_date ?? null,
      transcript: transcript ?? null,
      tasks_extracted: tasks.length,
      processed: true,
    }])

    if (meetingError) throw meetingError

    return new Response(
      JSON.stringify({ success: true, tasks_created: tasks.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
