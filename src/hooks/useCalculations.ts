'use client'

import { useMemo } from 'react'
import { calculateShoppingList } from '@/lib/calculations'
import type { Participant, ConsumptionConfig, ShoppingList } from '@/types'

export function useCalculations(
  participants: Participant[],
  config: ConsumptionConfig
): ShoppingList {
  return useMemo(
    () => calculateShoppingList(participants, config),
    [participants, config]
  )
}
