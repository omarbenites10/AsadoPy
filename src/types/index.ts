export type Sex = 'hombre' | 'mujer' | 'nino'

export type ContainerType = 'lata' | 'botella' | 'botellita' | 'otro'

export type CapacityUnit = 'ml' | 'litros'

export type AlcoholLevel = 'tranquilo' | 'normal' | 'fuerte'

export type AsadoStatus = 'activo' | 'finalizado'

// ── Alcohol level definitions ─────────────────────────────────────────────────

export const ALCOHOL_LEVEL_LITERS: Record<AlcoholLevel, number> = {
  tranquilo: 1.5,
  normal: 2,
  fuerte: 3,
}

export const ALCOHOL_LEVEL_LABELS: Record<AlcoholLevel, string> = {
  tranquilo: 'Tranquilo',
  normal: 'Normal',
  fuerte: 'Fuerte',
}

export const ALCOHOL_LEVEL_DESCRIPTIONS: Record<AlcoholLevel, string> = {
  tranquilo: '1.5 L por evento',
  normal: '2 L por evento',
  fuerte: '3 L por evento',
}

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  name: string
  sex: Sex
  drinksAlcohol: boolean
  alcoholLevel: AlcoholLevel
  phone: string
  createdAt: number
}

export interface Participant {
  id: string
  contactId?: string
  name: string
  sex: Sex
  drinksAlcohol: boolean
  alcoholLevel: AlcoholLevel
}

export interface SexConsumption {
  hombre: number
  mujer: number
  nino: number
}

export interface BeerConfig {
  containerType: ContainerType
  containerLabel: string
  capacity: number
  unit: CapacityUnit
}

export interface ConsumptionConfig {
  carne: SexConsumption
  chorizo: SexConsumption
  beer: BeerConfig
}

// ── Saved asado ───────────────────────────────────────────────────────────────

export interface SavedAsado {
  id: string
  name: string
  status: AsadoStatus
  participants: Participant[]
  config: ConsumptionConfig
  createdAt: number
  updatedAt: number
  finishedAt?: number
}

// ── Calculation results ───────────────────────────────────────────────────────

export interface CarbonResult {
  bags5kg: number
  bags3kg: number
  totalKg: number
  neededKg: number
}

export interface CervezaBreakdownItem {
  level: AlcoholLevel
  count: number
  liters: number
}

export interface CervezaResult {
  liters: number
  units: number
  containerType: ContainerType
  containerLabel: string
  capacity: number
  unit: CapacityUnit
  breakdown: CervezaBreakdownItem[]
}

export interface ShoppingList {
  totalParticipants: number
  drinkers: number
  nonDrinkers: number
  carne: { kg: number }
  chorizo: { kg: number }
  cerveza: CervezaResult
  mandioca: { bags: number; kg: number }
  pan: { kg: number }
  carbon: CarbonResult
  panDeAjo: { packages: number; grams: number }
  sopaParaguaya: { packages: number; kg: number }
  hielo: { bags: number; kg: number }
  limon: { units: number }
  bebidasSinAlcohol: { liters: number }
  mbeju: { packages: number; kg: number }
}

export type CalculatorStep = 'participantes' | 'configuracion' | 'lista'

// ── Labels & defaults ─────────────────────────────────────────────────────────

export const DEFAULT_CONSUMPTION_CONFIG: ConsumptionConfig = {
  carne: { hombre: 350, mujer: 250, nino: 100 },
  chorizo: { hombre: 150, mujer: 150, nino: 100 },
  beer: {
    containerType: 'lata',
    containerLabel: 'Lata',
    capacity: 473,
    unit: 'ml',
  },
}

export const SEX_LABELS: Record<Sex, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  nino: 'Niño',
}

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  lata: 'Lata',
  botella: 'Botella',
  botellita: 'Botellita',
  otro: 'Otro',
}

export const WHATSAPP_NUMBER = '595984411295'
