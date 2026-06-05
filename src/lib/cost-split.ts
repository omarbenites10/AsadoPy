import type { Participant, ConsumptionConfig } from '@/types'
import { ALCOHOL_LEVEL_LITERS } from '@/types'

export interface ItemPrices {
  carne: number
  chorizo: number
  cerveza: number
  hielo: number
  mandioca: number
  pan: number
  carbon: number
  panDeAjo: number
  sopaParaguaya: number
  limon: number
  bebidasSinAlcohol: number
  mbeju: number
}

export const EMPTY_PRICES: ItemPrices = {
  carne: 0, chorizo: 0, cerveza: 0, hielo: 0,
  mandioca: 0, pan: 0, carbon: 0, panDeAjo: 0,
  sopaParaguaya: 0, limon: 0, bebidasSinAlcohol: 0, mbeju: 0,
}

export interface Discount {
  id: string
  label: string
  amount: number  // negative = descuento, positive = cargo adicional
}

export type ParticipantCost = { id: string; name: string; total: number } & ItemPrices

export interface ParticipantPayment {
  participantId: string
  name: string
  amountDue: number
  amountPaid: number
  isPaid: boolean
}

export interface SavedCostSplit {
  asadoId: string
  prices: ItemPrices
  discounts: Discount[]
  payments: ParticipantPayment[]
  savedAt: number
  updatedAt: number
}

export function calculateCostSplit(
  participants: Participant[],
  config: ConsumptionConfig,
  prices: ItemPrices,
  discounts: Discount[] = [],
): ParticipantCost[] {
  const n = participants.length
  if (n === 0) return []

  const drinkers = participants.filter(p => p.drinksAlcohol && p.sex !== 'nino')
  const nonDrinkers = participants.filter(p => !p.drinksAlcohol || p.sex === 'nino')

  const totalCarneG = participants.reduce((s, p) => s + config.carne[p.sex], 0)
  const totalChorizoG = participants.reduce((s, p) => s + config.chorizo[p.sex], 0)
  const totalBeerL = drinkers.reduce((s, p) => s + ALCOHOL_LEVEL_LITERS[p.alcoholLevel], 0)

  // Discount factor applied proportionally to every item and every participant
  const subtotal = Object.values(prices).reduce((s, v) => s + v, 0)
  const totalDiscounts = discounts.reduce((s, d) => s + d.amount, 0)
  const discountFactor = subtotal > 0 ? (subtotal + totalDiscounts) / subtotal : 1

  const each = 1 / n

  const raw = participants.map(p => {
    const isDrinker = p.drinksAlcohol && p.sex !== 'nino'

    const apply = (v: number) => v * discountFactor

    const carne = apply(totalCarneG > 0 ? prices.carne * config.carne[p.sex] / totalCarneG : 0)
    const chorizo = apply(totalChorizoG > 0 ? prices.chorizo * config.chorizo[p.sex] / totalChorizoG : 0)
    const cerveza = apply(isDrinker && totalBeerL > 0 ? prices.cerveza * ALCOHOL_LEVEL_LITERS[p.alcoholLevel] / totalBeerL : 0)
    const hielo = apply(isDrinker && totalBeerL > 0 ? prices.hielo * ALCOHOL_LEVEL_LITERS[p.alcoholLevel] / totalBeerL : 0)
    const bebidasSinAlcohol = apply(!isDrinker && nonDrinkers.length > 0 ? prices.bebidasSinAlcohol / nonDrinkers.length : 0)
    const mandioca = apply(prices.mandioca * each)
    const pan = apply(prices.pan * each)
    const carbon = apply(prices.carbon * each)
    const panDeAjo = apply(prices.panDeAjo * each)
    const sopaParaguaya = apply(prices.sopaParaguaya * each)
    const limon = apply(prices.limon * each)
    const mbeju = apply(prices.mbeju * each)

    const total = carne + chorizo + cerveza + hielo + bebidasSinAlcohol
      + mandioca + pan + carbon + panDeAjo + sopaParaguaya + limon + mbeju

    return {
      id: p.id, name: p.name,
      carne, chorizo, cerveza, hielo, bebidasSinAlcohol,
      mandioca, pan, carbon, panDeAjo, sopaParaguaya, limon, mbeju,
      total,
    }
  })

  // Redistribute "Yo" (isSelf) share to other participants
  const selfIds = new Set(participants.filter(p => p.isSelf).map(p => p.id))
  if (selfIds.size === 0) return raw

  const grandTotal = raw.reduce((s, r) => s + r.total, 0)
  const selfTotal = raw.filter(r => selfIds.has(r.id)).reduce((s, r) => s + r.total, 0)
  const nonSelfTotal = grandTotal - selfTotal
  const scaleFactor = nonSelfTotal > 0 ? grandTotal / nonSelfTotal : 1

  const zero: ItemPrices = { carne: 0, chorizo: 0, cerveza: 0, hielo: 0, bebidasSinAlcohol: 0, mandioca: 0, pan: 0, carbon: 0, panDeAjo: 0, sopaParaguaya: 0, limon: 0, mbeju: 0 }

  return raw.map(r => {
    if (selfIds.has(r.id)) return { ...r, ...zero, total: 0 }
    return {
      ...r,
      carne: r.carne * scaleFactor,
      chorizo: r.chorizo * scaleFactor,
      cerveza: r.cerveza * scaleFactor,
      hielo: r.hielo * scaleFactor,
      bebidasSinAlcohol: r.bebidasSinAlcohol * scaleFactor,
      mandioca: r.mandioca * scaleFactor,
      pan: r.pan * scaleFactor,
      carbon: r.carbon * scaleFactor,
      panDeAjo: r.panDeAjo * scaleFactor,
      sopaParaguaya: r.sopaParaguaya * scaleFactor,
      limon: r.limon * scaleFactor,
      mbeju: r.mbeju * scaleFactor,
      total: r.total * scaleFactor,
    }
  })
}
