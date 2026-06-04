'use client'

import { useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage'
import { supabase, toAsadoRow, fromAsadoRow } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import type { SavedAsado, Participant, ConsumptionConfig } from '@/types'

export function useAsados() {
  const [asados, setAsados] = useLocalStorage<SavedAsado[]>(STORAGE_KEYS.ASADOS, [])
  const { user } = useAuthStore()

  // ── Initial sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !supabase) return
    const sb = supabase

    const sync = async () => {
      try {
        if (asados.length > 0) {
          await sb
            .from('asados')
            .upsert(asados.map((a) => toAsadoRow(a, user.id)), {
              onConflict: 'id',
              ignoreDuplicates: true,
            })
        }
        const { data } = await sb
          .from('asados')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
        if (data) setAsados(data.map(fromAsadoRow))
      } catch (e) {
        console.error('Asados sync error:', e)
      }
    }

    sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ── Real-time subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !supabase) return
    const sb = supabase

    const channel = sb
      .channel(`asados-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asados', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setAsados((prev) => prev.filter((a) => a.id !== (payload.old as { id: string }).id))
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = fromAsadoRow(payload.new as Parameters<typeof fromAsadoRow>[0])
            setAsados((prev) => {
              const exists = prev.some((a) => a.id === updated.id)
              return exists ? prev.map((a) => (a.id === updated.id ? updated : a)) : [updated, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [user?.id, setAsados])

  // ── Write helpers ─────────────────────────────────────────────────────────────

  const saveNew = useCallback(
    async (name: string, participants: Participant[], config: ConsumptionConfig): Promise<SavedAsado> => {
      const asado: SavedAsado = {
        id: generateId(),
        name: name.trim(),
        status: 'activo',
        participants,
        config,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setAsados((prev) => [asado, ...prev])
      if (user && supabase) {
        const sb = supabase
        sb.from('asados').insert(toAsadoRow(asado, user.id)).then(({ error }) => { if (error) console.error(error) })
      }
      return asado
    },
    [setAsados, user]
  )

  const update = useCallback(
    (id: string, participants: Participant[], config: ConsumptionConfig, name?: string) => {
      const now = Date.now()
      setAsados((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...(name ? { name: name.trim() } : {}), participants, config, updatedAt: now }
            : a
        )
      )
      if (user && supabase) {
        const sb = supabase
        sb.from('asados')
          .update({ ...(name ? { name } : {}), participants, config, updated_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => { if (error) console.error(error) })
      }
    },
    [setAsados, user]
  )

  const finish = useCallback(
    (id: string) => {
      const now = Date.now()
      setAsados((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'finalizado' as const, finishedAt: now, updatedAt: now }
            : a
        )
      )
      if (user && supabase) {
        const sb = supabase
        sb.from('asados')
          .update({ status: 'finalizado', finished_at: now, updated_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => { if (error) console.error(error) })
      }
    },
    [setAsados, user]
  )

  const duplicate = useCallback(
    async (id: string): Promise<SavedAsado | null> => {
      const original = asados.find((a) => a.id === id)
      if (!original) return null
      const copy: SavedAsado = {
        ...original,
        id: generateId(),
        name: `Copia de ${original.name}`,
        status: 'activo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        finishedAt: undefined,
      }
      setAsados((prev) => [copy, ...prev])
      if (user && supabase) {
        const sb = supabase
        sb.from('asados').insert(toAsadoRow(copy, user.id)).then(({ error }) => { if (error) console.error(error) })
      }
      return copy
    },
    [asados, setAsados, user]
  )

  const remove = useCallback(
    (id: string) => {
      setAsados((prev) => prev.filter((a) => a.id !== id))
      if (user && supabase) {
        const sb = supabase
        sb.from('asados').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
      }
    },
    [setAsados, user]
  )

  const getById = useCallback(
    (id: string) => asados.find((a) => a.id === id) ?? null,
    [asados]
  )

  return {
    asados,
    activos: asados.filter((a) => a.status === 'activo'),
    finalizados: asados.filter((a) => a.status === 'finalizado'),
    saveNew,
    update,
    finish,
    duplicate,
    remove,
    getById,
  }
}
