'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '@/lib/storage'
import { DEFAULT_CONSUMPTION_CONFIG } from '@/types'
import type { ConsumptionConfig, SexConsumption, BeerConfig } from '@/types'

export function useConsumptionConfig() {
  const [config, setConfig] = useLocalStorage<ConsumptionConfig>(
    STORAGE_KEYS.CONSUMPTION_CONFIG,
    DEFAULT_CONSUMPTION_CONFIG
  )

  const updateCarne = useCallback(
    (values: Partial<SexConsumption>) => {
      setConfig((prev) => ({ ...prev, carne: { ...prev.carne, ...values } }))
    },
    [setConfig]
  )

  const updateChorizo = useCallback(
    (values: Partial<SexConsumption>) => {
      setConfig((prev) => ({ ...prev, chorizo: { ...prev.chorizo, ...values } }))
    },
    [setConfig]
  )

  const updateCerveza = useCallback(
    (values: Partial<SexConsumption>) => {
      setConfig((prev) => ({ ...prev, cerveza: { ...prev.cerveza, ...values } }))
    },
    [setConfig]
  )

  const updateBeer = useCallback(
    (values: Partial<BeerConfig>) => {
      setConfig((prev) => ({ ...prev, beer: { ...prev.beer, ...values } }))
    },
    [setConfig]
  )

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONSUMPTION_CONFIG)
  }, [setConfig])

  return {
    config,
    updateCarne,
    updateChorizo,
    updateCerveza,
    updateBeer,
    resetToDefaults,
  }
}
