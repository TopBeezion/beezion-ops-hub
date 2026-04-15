import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Subtask } from '../types'

export function useSubtasks(taskId?: string) {
  return useQuery<Subtask[]>({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      if (!taskId) return []
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!taskId,
  })
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      task_id: string
      title: string
      status?: Subtask['status']
      assignee?: string | null
      due_date?: string | null
      position?: number
    }) => {
      const { error } = await supabase.from('subtasks').insert([{
        task_id: input.task_id,
        title: input.title,
        status: input.status ?? 'pendiente',
        assignee: input.assignee ?? null,
        due_date: input.due_date ?? null,
        position: input.position ?? 0,
      }])
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', v.task_id] })
    },
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, task_id, ...fields }: Partial<Subtask> & { id: string; task_id: string }) => {
      const { error } = await supabase.from('subtasks').update(fields).eq('id', id)
      if (error) throw error
      return { task_id }
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', r.task_id] })
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, task_id }: { id: string; task_id: string }) => {
      const { error } = await supabase.from('subtasks').delete().eq('id', id)
      if (error) throw error
      return { task_id }
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', r.task_id] })
    },
  })
}
