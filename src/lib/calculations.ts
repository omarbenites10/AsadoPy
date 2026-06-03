import type {
  Participant,
  ConsumptionConfig,
  ShoppingList,
  CarbonResult,
  CervezaResult,
  CervezaBreakdownItem,
  AlcoholLevel,
  Sex,
  SexConsumption,
} from '@/types'
import { ALCOHOL_LEVEL_LITERS } from '@/types'

function getGrams(sex: Sex, values: SexConsumption): number {
  if (sex === 'hombre') return values.hombre
  if (sex === 'mujer') return values.mujer
  return values.nino
}

function roundUpTo100g(grams: number): number {
  if (grams <= 0) return 0
  return Math.ceil(grams / 100) * 100
}

// Mandioca / Sopa Paraguaya / Mbeju rounding:
// decimal 0.1–0.4 → floor (bajar)
// decimal 0.5+    → ceil (subir)
function roundKgBags(kg: number): number {
  if (kg <= 0) return 0
  const intPart = Math.floor(kg)
  const decPart = Math.round((kg - intPart) * 10) / 10
  if (decPart >= 0.5) return intPart + 1
  return intPart
}

function calculateCarne(participants: Participant[], config: ConsumptionConfig): number {
  const totalGrams = participants.reduce(
    (sum, p) => sum + getGrams(p.sex, config.carne),
    0
  )
  const roundedGrams = roundUpTo100g(totalGrams)
  const kg = roundedGrams / 1000
  return Math.max(1, kg)
}

function calculateChorizo(participants: Participant[], config: ConsumptionConfig): number {
  const totalGrams = participants.reduce(
    (sum, p) => sum + getGrams(p.sex, config.chorizo),
    0
  )
  const roundedGrams = roundUpTo100g(totalGrams)
  const kg = roundedGrams / 1000
  return Math.max(0.5, kg)
}

function calculateCerveza(
  participants: Participant[],
  config: ConsumptionConfig
): CervezaResult {
  const drinkers = participants.filter((p) => p.drinksAlcohol)

  const levelCounts: Partial<Record<AlcoholLevel, number>> = {}
  for (const p of drinkers) {
    const lvl = p.alcoholLevel ?? 'normal'
    levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1
  }

  const breakdown: CervezaBreakdownItem[] = (
    Object.entries(levelCounts) as [AlcoholLevel, number][]
  ).map(([level, count]) => ({
    level,
    count,
    liters: count * ALCOHOL_LEVEL_LITERS[level],
  }))

  const totalLiters = breakdown.reduce((sum, b) => sum + b.liters, 0)

  const capacityLiters =
    config.beer.unit === 'ml'
      ? config.beer.capacity / 1000
      : config.beer.capacity

  const units = capacityLiters > 0 ? Math.ceil(totalLiters / capacityLiters) : 0

  return {
    liters: totalLiters,
    units,
    containerType: config.beer.containerType,
    containerLabel: config.beer.containerLabel,
    capacity: config.beer.capacity,
    unit: config.beer.unit,
    breakdown,
  }
}

function calculateMandioca(participants: Participant[]): { bags: number; kg: number } {
  const kg = participants.length * 0.1
  const bags = roundKgBags(kg)
  return { bags, kg }
}

function calculatePan(participants: Participant[]): number {
  const totalGrams = participants.length * 150
  const roundedGrams = roundUpTo100g(totalGrams)
  const kg = roundedGrams / 1000
  return Math.max(0.5, kg)
}

function calculateCarbon(carneKg: number, chorizoKg: number): CarbonResult {
  const neededKg = Math.ceil(carneKg + chorizoKg)

  let best: CarbonResult | null = null
  const maxB = Math.ceil(neededKg / 5) + 2

  for (let b = 0; b <= maxB; b++) {
    const remaining = neededKg - 5 * b
    const a = remaining > 0 ? Math.ceil(remaining / 3) : 0
    const total = 3 * a + 5 * b

    if (total < neededKg) continue

    if (best === null) {
      best = { bags5kg: b, bags3kg: a, totalKg: total, neededKg }
    } else {
      const excess = total - neededKg
      const bestExcess = best.totalKg - neededKg

      if (excess < bestExcess || (excess === bestExcess && total > best.totalKg)) {
        best = { bags5kg: b, bags3kg: a, totalKg: total, neededKg }
      }
    }
  }

  return best ?? { bags5kg: 1, bags3kg: 0, totalKg: 5, neededKg }
}

function calculatePanDeAjo(participants: Participant[]): { packages: number; grams: number } {
  const grams = participants.length * 100
  const packages = Math.ceil(grams / 400)
  return { packages, grams }
}

function calculateSopaParaguaya(participants: Participant[]): { packages: number; kg: number } {
  const kg = participants.length * 0.1
  const packages = roundKgBags(kg)
  return { packages, kg }
}

function calculateBebidasSinAlcohol(participants: Participant[]): number {
  const nonDrinkers = participants.filter((p) => !p.drinksAlcohol)
  const liters = nonDrinkers.length * 0.5
  return Math.ceil(liters)
}

function calculateHielo(
  cerveraLiters: number,
  bebidasLiters: number
): { bags: number; kg: number } {
  const totalLiters = cerveraLiters + bebidasLiters
  const kg = totalLiters / 2
  const bags = Math.ceil(kg / 3)
  return { bags, kg }
}

function calculateMbeju(participants: Participant[]): { packages: number; kg: number } {
  const kg = participants.length * 0.1
  const packages = roundKgBags(kg)
  return { packages, kg }
}

export function calculateShoppingList(
  participants: Participant[],
  config: ConsumptionConfig
): ShoppingList {
  if (participants.length === 0) {
    return {
      totalParticipants: 0,
      drinkers: 0,
      nonDrinkers: 0,
      carne: { kg: 1 },
      chorizo: { kg: 0.5 },
      cerveza: {
        liters: 0,
        units: 0,
        containerType: config.beer.containerType,
        containerLabel: config.beer.containerLabel,
        capacity: config.beer.capacity,
        unit: config.beer.unit,
        breakdown: [],
      },
      mandioca: { bags: 0, kg: 0 },
      pan: { kg: 0.5 },
      carbon: { bags5kg: 0, bags3kg: 1, totalKg: 3, neededKg: 0 },
      panDeAjo: { packages: 0, grams: 0 },
      sopaParaguaya: { packages: 0, kg: 0 },
      hielo: { bags: 0, kg: 0 },
      limon: { units: 6 },
      bebidasSinAlcohol: { liters: 0 },
      mbeju: { packages: 0, kg: 0 },
    }
  }

  const drinkers = participants.filter((p) => p.drinksAlcohol).length
  const nonDrinkers = participants.filter((p) => !p.drinksAlcohol).length
  const carneKg = calculateCarne(participants, config)
  const chorizoKg = calculateChorizo(participants, config)
  const cerveza = calculateCerveza(participants, config)
  const mandioca = calculateMandioca(participants)
  const panKg = calculatePan(participants)
  const carbon = calculateCarbon(carneKg, chorizoKg)
  const panDeAjo = calculatePanDeAjo(participants)
  const sopaParaguaya = calculateSopaParaguaya(participants)
  const bebidasSinAlcohol = calculateBebidasSinAlcohol(participants)
  const hielo = calculateHielo(cerveza.liters, bebidasSinAlcohol)
  const mbeju = calculateMbeju(participants)

  return {
    totalParticipants: participants.length,
    drinkers,
    nonDrinkers,
    carne: { kg: carneKg },
    chorizo: { kg: chorizoKg },
    cerveza,
    mandioca,
    pan: { kg: panKg },
    carbon,
    panDeAjo,
    sopaParaguaya,
    hielo,
    limon: { units: 6 },
    bebidasSinAlcohol: { liters: bebidasSinAlcohol },
    mbeju,
  }
}
