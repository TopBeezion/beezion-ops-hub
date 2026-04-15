import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Resolve a stable user key: prefers Supabase auth user id, falls back to a
// browser-scoped random id persisted in localStorage so per-user views still
// stick even without auth.
function resolveUserKey(): string {
  try {
    const ls = localStorage.getItem('beezion.user_key')
    if (ls) return ls
    const k = 'anon-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('beezion.user_key', k)
    return k
  } catch {
    return 'anon'
  }
}

let _cachedUserKey: string | null = null
async function getUserKey(): Promise<string> {
  if (_cachedUserKey) return _cachedUserKey
  try {
    const { data } = await supabase.auth.getUser()
    if (data.user?.id) {
      _cachedUserKey = data.user.id
      return _cachedUserKey
    }
  } catch { /* ignore */ }
  _cachedUserKey = resolveUserKey()
  return _cachedUserKey
}

/**
 * Persist a page-level user preference blob in Supabase `user_preferences`,
 * keyed by (user, page_key). Falls back to localStorage if Supabase fails.
 */
export function useUserPreference<T>(pageKey: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [loaded, setLoaded] = useState(false)

  // Load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const userKey = await getUserKey()
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('config')
          .eq('user_key', userKey)
          .eq('page_key', pageKey)
          .maybeSingle()
        if (cancelled) return
        if (!error && data?.config) {
          setValue({ ...defaultValue, ...(data.config as T) })
        } else {
          // fallback to localStorage
          const ls = localStorage.getItem(`beezion.pref.${pageKey}`)
          if (ls) setValue({ ...defaultValue, ...JSON.parse(ls) })
        }
      } catch {
        const ls = localStorage.getItem(`beezion.pref.${pageKey}`)
        if (!cancelled && ls) setValue({ ...defaultValue, ...JSON.parse(ls) })
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey])

  // Save (debounced)
  const save = useCallback(async (next: T) => {
    setValue(next)
    try {
      localStorage.setItem(`beezion.pref.${pageKey}`, JSON.stringify(next))
    } catch { /* ignore */ }
    const userKey = await getUserKey()
    try {
      await supabase.from('user_preferences').upsert({
        user_key: userKey,
        page_key: pageKey,
        config: next as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_key,page_key' })
    } catch { /* silently ignore — localStorage already has it */ }
  }, [pageKey])

  return { value, setValue: save, loaded }
}
