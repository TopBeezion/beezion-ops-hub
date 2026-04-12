import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface BeezionUser {
  name: string
  email: string
  role: string
}

const STORAGE_KEY = 'beezion_user'

export function useAuth() {
  const [user, setUser] = useState<BeezionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  // Verificar email contra team_members y entrar directo
  const signIn = async (email: string): Promise<{ error: string | null }> => {
    const clean = email.toLowerCase().trim()

    const { data, error } = await supabase
      .from('team_members')
      .select('name, email, role')
      .eq('email', clean)
      .maybeSingle()

    if (error) return { error: 'Error de conexión. Intenta de nuevo.' }
    if (!data)  return { error: 'Correo no autorizado. Usa tu correo @beezion.com.' }

    const beezionUser: BeezionUser = { name: data.name, email: data.email, role: data.role }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(beezionUser))
    setUser(beezionUser)
    return { error: null }
  }

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return { user, loading, signIn, signOut }
}
