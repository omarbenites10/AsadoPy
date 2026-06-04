'use client'

import { useEffect } from 'react'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'

/** Call once in the root header to initialize auth listeners. */
export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setLoading])
}

/** Use anywhere to read auth state and call sign-in/out. */
export function useAuth() {
  const { user, loading, syncing } = useAuthStore()

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, syncing, signIn, signUp, signOut, isSupabaseEnabled }
}
