'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '@/lib/storage'
import type { ItemPrices, Discount, ParticipantPayment, SavedCostSplit } from '@/lib/cost-split'

type CostSplitStore = Record<string, SavedCostSplit>

export function useCostSplit(asadoId: string | null) {
  const [store, setStore] = useLocalStorage<CostSplitStore>(STORAGE_KEYS.COST_SPLITS, {})

  const data: SavedCostSplit | null = asadoId ? (store[asadoId] ?? null) : null

  const save = useCallback(
    (prices: ItemPrices, discounts: Discount[], payments: ParticipantPayment[]) => {
      if (!asadoId) return
      const now = Date.now()
      setStore(prev => ({
        ...prev,
        [asadoId]: {
          asadoId,
          prices,
          discounts,
          payments,
          savedAt: prev[asadoId]?.savedAt ?? now,
          updatedAt: now,
        },
      }))
    },
    [asadoId, setStore]
  )

  const updatePayment = useCallback(
    (participantId: string, update: Partial<ParticipantPayment>) => {
      if (!asadoId) return
      setStore(prev => {
        const split = prev[asadoId]
        if (!split) return prev
        return {
          ...prev,
          [asadoId]: {
            ...split,
            payments: split.payments.map(p =>
              p.participantId === participantId ? { ...p, ...update } : p
            ),
            updatedAt: Date.now(),
          },
        }
      })
    },
    [asadoId, setStore]
  )

  const remove = useCallback(() => {
    if (!asadoId) return
    setStore(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [asadoId]: _removed, ...rest } = prev
      return rest
    })
  }, [asadoId, setStore])

  return { data, save, updatePayment, remove }
}
