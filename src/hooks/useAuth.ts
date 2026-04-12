import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Magic link — verifica que el email esté en team_members antes de enviar
  const signInWithMagicLink = async (email: string) => {
    // 1. Verificar que el correo esté autorizado en team_members
    const { data, error: lookupError } = await supabase
      .from('team_members')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (lookupError) return { error: 'Error al verificar el correo. Intenta de nuevo.' }
    if (!data) return { error: 'Este correo no está autorizado. Usa tu correo @beezion.com.' }

    // 2. Enviar magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: false, // solo usuarios ya registrados en Supabase Auth
      },
    })

    if (error) {
      // Si el usuario no existe en Auth aún, crearlo automáticamente
      if (error.message.includes('not found') || error.message.includes('Signups not allowed')) {
        const { error: error2 } = await supabase.auth.signInWithOtp({
          email: email.toLowerCase().trim(),
          options: { shouldCreateUser: true },
        })
        if (error2) return { error: 'No se pudo enviar el correo. Intenta de nuevo.' }
        return { error: null }
      }
      return { error: 'No se pudo enviar el correo. Intenta de nuevo.' }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, loading, signInWithMagicLink, signOut }
}
