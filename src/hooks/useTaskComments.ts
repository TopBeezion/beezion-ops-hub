import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskComment } from '../types'
import { TEAM_MEMBERS } from '../lib/constants'

// ── Fetch comments for a task ────────────────────────────────────────────────
export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task_comments', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as TaskComment[]
    },
  })
}

// ── Extract @mentions from text ──────────────────────────────────────────────
export function extractMentions(text: string): string[] {
  const names = TEAM_MEMBERS.filter(n => n !== 'TBD')
  const pattern = new RegExp(`@(${names.join('|')})`, 'g')
  const found = new Set<string>()
  let match
  while ((match = pattern.exec(text)) !== null) {
    found.add(match[1])
  }
  return Array.from(found)
}

// ── Create a comment ─────────────────────────────────────────────────────────
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId, author, body,
    }: {
      taskId: string; author: string; body: string
    }) => {
      const mentions = extractMentions(body)
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{ task_id: taskId, author, body, mentions }])
        .select()
        .single()
      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task_comments', variables.taskId] })
    },
  })
}

// ── Realtime subscription for new comments ───────────────────────────────────
export function useRealtimeComments(taskId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task_comments', taskId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [taskId, queryClient])
}
