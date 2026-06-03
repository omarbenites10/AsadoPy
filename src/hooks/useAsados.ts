'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage'
import type { SavedAsado, Participant, ConsumptionConfig } from '@/types'

export function useAsados() {
  const [asados, setAsados] = useLocalStorage<SavedAsado[]>(STORAGE_KEYS.ASADOS, [])

  const saveNew = useCallback(
    (name: string, participants: Participant[], config: ConsumptionConfig): SavedAsado => {
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
      return asado
    },
    [setAsados]
  )

  const update = useCallback(
    (id: string, participants: Participant[], config: ConsumptionConfig, name?: string) => {
      setAsados((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...(name ? { name: name.trim() } : {}),
                participants,
                config,
                updatedAt: Date.now(),
              }
            : a
        )
      )
    },
    [setAsados]
  )

  const finish = useCallback(
    (id: string) => {
      setAsados((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'finalizado' as const, finishedAt: Date.now(), updatedAt: Date.now() }
            : a
        )
      )
    },
    [setAsados]
  )

  const duplicate = useCallback(
    (id: string): SavedAsado | null => {
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
      return copy
    },
    [asados, setAsados]
  )

  const remove = useCallback(
    (id: string) => {
      setAsados((prev) => prev.filter((a) => a.id !== id))
    },
    [setAsados]
  )

  const getById = useCallback(
    (id: string) => asados.find((a) => a.id === id) ?? null,
    [asados]
  )

  const activos = asados.filter((a) => a.status === 'activo')
  const finalizados = asados.filter((a) => a.status === 'finalizado')

  return {
    asados,
    activos,
    finalizados,
    saveNew,
    update,
    finish,
    duplicate,
    remove,
    getById,
  }
}
