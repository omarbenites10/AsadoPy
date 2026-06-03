import { describe, it, expect } from 'vitest'
import { calculateShoppingList } from '../lib/calculations'
import { DEFAULT_CONSUMPTION_CONFIG } from '../types'
import type { Participant, ConsumptionConfig, AlcoholLevel } from '../types'

function p(
  sex: 'hombre' | 'mujer' | 'nino',
  drinksAlcohol = true,
  alcoholLevel: AlcoholLevel = 'normal'
): Participant {
  const drinks = sex === 'nino' ? false : drinksAlcohol
  return {
    id: Math.random().toString(),
    name: 'Test',
    sex,
    drinksAlcohol: drinks,
    alcoholLevel: drinks ? alcoholLevel : 'normal',
  }
}

const cfg = DEFAULT_CONSUMPTION_CONFIG

// ── Carne ──────────────────────────────────────────────────────────────────────
describe('Carne', () => {
  it('rounds up to next 100g multiple', () => {
    expect(calculateShoppingList([p('hombre')], cfg).carne.kg).toBe(1)
  })

  it('3 hombres = 1050g → 1.1 kg', () => {
    const result = calculateShoppingList([p('hombre'), p('hombre'), p('hombre')], cfg)
    expect(result.carne.kg).toBe(1.1)
  })

  it('2 hombres + 1 mujer + 1 niño = 1050g → 1.1 kg', () => {
    const result = calculateShoppingList([p('hombre'), p('hombre'), p('mujer'), p('nino')], cfg)
    expect(result.carne.kg).toBe(1.1)
  })

  it('3 hombres + 1 mujer = 1300g → 1.3 kg', () => {
    const result = calculateShoppingList([p('hombre'), p('hombre'), p('hombre'), p('mujer')], cfg)
    expect(result.carne.kg).toBe(1.3)
  })

  it('enforces minimum 1 kg', () => {
    expect(calculateShoppingList([p('nino')], cfg).carne.kg).toBeGreaterThanOrEqual(1)
  })
})

// ── Chorizo ────────────────────────────────────────────────────────────────────
describe('Chorizo', () => {
  it('3 hombres + 2 niños = 650g → 0.7 kg', () => {
    const result = calculateShoppingList([p('hombre'), p('hombre'), p('hombre'), p('nino'), p('nino')], cfg)
    expect(result.chorizo.kg).toBe(0.7)
  })

  it('7 hombres + 1 niño = 1150g → 1.2 kg', () => {
    const result = calculateShoppingList(
      [...Array.from({ length: 7 }, () => p('hombre')), p('nino')],
      cfg
    )
    expect(result.chorizo.kg).toBe(1.2)
  })

  it('enforces minimum 0.5 kg', () => {
    expect(calculateShoppingList([p('nino')], cfg).chorizo.kg).toBeGreaterThanOrEqual(0.5)
  })
})

// ── Cerveza — usa alcoholLevel por participante ────────────────────────────────
describe('Cerveza', () => {
  it('tranquilo = 1.5L', () => {
    expect(calculateShoppingList([p('hombre', true, 'tranquilo')], cfg).cerveza.liters).toBe(1.5)
  })

  it('normal = 2L', () => {
    expect(calculateShoppingList([p('hombre', true, 'normal')], cfg).cerveza.liters).toBe(2)
  })

  it('fuerte = 3L', () => {
    expect(calculateShoppingList([p('hombre', true, 'fuerte')], cfg).cerveza.liters).toBe(3)
  })

  it('mezcla: 1 tranquilo + 1 normal + 1 fuerte = 6.5L', () => {
    const result = calculateShoppingList([
      p('hombre', true, 'tranquilo'),
      p('mujer', true, 'normal'),
      p('hombre', true, 'fuerte'),
    ], cfg)
    expect(result.cerveza.liters).toBe(6.5)
  })

  it('non-drinkers contribute 0', () => {
    const result = calculateShoppingList([p('hombre', false), p('mujer', false)], cfg)
    expect(result.cerveza.liters).toBe(0)
    expect(result.cerveza.units).toBe(0)
  })

  it('niños always 0 liters', () => {
    expect(calculateShoppingList([p('nino')], cfg).cerveza.liters).toBe(0)
  })

  it('units: 1 fuerte (3L) / 473ml = 7 latas', () => {
    expect(calculateShoppingList([p('hombre', true, 'fuerte')], cfg).cerveza.units).toBe(7)
  })

  it('units with litros unit: 3L / 1.5L = 2 botellas', () => {
    const cfgCustom: ConsumptionConfig = {
      ...cfg,
      beer: { containerType: 'botella', containerLabel: 'Botella', capacity: 1.5, unit: 'litros' },
    }
    expect(calculateShoppingList([p('hombre', true, 'fuerte')], cfgCustom).cerveza.units).toBe(2)
  })

  it('breakdown groups by level', () => {
    const result = calculateShoppingList([
      p('hombre', true, 'tranquilo'),
      p('hombre', true, 'tranquilo'),
      p('mujer', true, 'fuerte'),
    ], cfg)
    const tranquilo = result.cerveza.breakdown.find(b => b.level === 'tranquilo')
    const fuerte = result.cerveza.breakdown.find(b => b.level === 'fuerte')
    expect(tranquilo?.count).toBe(2)
    expect(tranquilo?.liters).toBe(3)
    expect(fuerte?.count).toBe(1)
    expect(fuerte?.liters).toBe(3)
    expect(result.cerveza.liters).toBe(6)
  })
})

// ── Mandioca ──────────────────────────────────────────────────────────────────
describe('Mandioca', () => {
  it('12 personas → 1 bolsa', () => {
    expect(calculateShoppingList(Array.from({ length: 12 }, () => p('hombre')), cfg).mandioca.bags).toBe(1)
  })
  it('14 personas → 1 bolsa', () => {
    expect(calculateShoppingList(Array.from({ length: 14 }, () => p('hombre')), cfg).mandioca.bags).toBe(1)
  })
  it('15 personas → 2 bolsas', () => {
    expect(calculateShoppingList(Array.from({ length: 15 }, () => p('hombre')), cfg).mandioca.bags).toBe(2)
  })
  it('18 personas → 2 bolsas', () => {
    expect(calculateShoppingList(Array.from({ length: 18 }, () => p('hombre')), cfg).mandioca.bags).toBe(2)
  })
})

// ── Carbón ────────────────────────────────────────────────────────────────────
describe('Carbón', () => {
  it('always covers needed kg', () => {
    const result = calculateShoppingList(Array.from({ length: 10 }, () => p('hombre')), cfg)
    expect(result.carbon.totalKg).toBeGreaterThanOrEqual(result.carbon.neededKg)
    expect(result.carbon.bags5kg * 5 + result.carbon.bags3kg * 3).toBe(result.carbon.totalKg)
  })

  it('15 hombres: needed 8 kg → 1×5 + 1×3 = 8 kg', () => {
    // carne = roundUp(15×350=5250)=5300=5.3kg; chorizo = roundUp(15×150=2250)=2300=2.3kg
    // carbon needed = ceil(5.3+2.3) = ceil(7.6) = 8
    const result = calculateShoppingList(Array.from({ length: 15 }, () => p('hombre')), cfg)
    expect(result.carbon.neededKg).toBe(8)
    expect(result.carbon.bags5kg).toBe(1)
    expect(result.carbon.bags3kg).toBe(1)
    expect(result.carbon.totalKg).toBe(8)
  })
})

// ── Pan de ajo ────────────────────────────────────────────────────────────────
describe('Pan de ajo', () => {
  it('7 personas = 700g → 2 paquetes', () => {
    expect(calculateShoppingList(Array.from({ length: 7 }, () => p('hombre')), cfg).panDeAjo.packages).toBe(2)
  })
  it('1 persona = 100g → 1 paquete', () => {
    expect(calculateShoppingList([p('hombre')], cfg).panDeAjo.packages).toBe(1)
  })
})

// ── Sopa Paraguaya & Mbeju ────────────────────────────────────────────────────
describe('Sopa Paraguaya y Mbeju', () => {
  it('12 personas (1.2kg) → 1 paquete', () => {
    const r = calculateShoppingList(Array.from({ length: 12 }, () => p('hombre')), cfg)
    expect(r.sopaParaguaya.packages).toBe(1)
    expect(r.mbeju.packages).toBe(1)
  })
  it('15 personas (1.5kg) → 2 paquetes', () => {
    const r = calculateShoppingList(Array.from({ length: 15 }, () => p('hombre')), cfg)
    expect(r.sopaParaguaya.packages).toBe(2)
    expect(r.mbeju.packages).toBe(2)
  })
})

// ── Bebidas sin alcohol ───────────────────────────────────────────────────────
describe('Bebidas sin alcohol', () => {
  it('3 non-drinkers → ceil(1.5) = 2 litros', () => {
    expect(calculateShoppingList(Array.from({ length: 3 }, () => p('hombre', false)), cfg).bebidasSinAlcohol.liters).toBe(2)
  })
  it('7 non-drinkers → ceil(3.5) = 4 litros', () => {
    expect(calculateShoppingList(Array.from({ length: 7 }, () => p('mujer', false)), cfg).bebidasSinAlcohol.liters).toBe(4)
  })
})

// ── Hielo ─────────────────────────────────────────────────────────────────────
describe('Hielo', () => {
  it('cerveza 4L + bebidas 2L → total 6L → 3kg → 1 bolsa', () => {
    // 2 normales = 4L cerveza; 4 no-drinkers × 0.5L = 2L bebidas
    const result = calculateShoppingList([
      p('hombre', true, 'normal'),
      p('hombre', true, 'normal'),
      p('mujer', false),
      p('mujer', false),
      p('mujer', false),
      p('mujer', false),
    ], cfg)
    expect(result.cerveza.liters).toBe(4)
    expect(result.bebidasSinAlcohol.liters).toBe(2)
    expect(result.hielo.kg).toBe(3)
    expect(result.hielo.bags).toBe(1)
  })
})

// ── Limón ─────────────────────────────────────────────────────────────────────
describe('Limón', () => {
  it('always 6', () => {
    expect(calculateShoppingList([p('hombre')], cfg).limon.units).toBe(6)
    expect(calculateShoppingList(Array.from({ length: 20 }, () => p('hombre')), cfg).limon.units).toBe(6)
  })
})

// ── Pan ───────────────────────────────────────────────────────────────────────
describe('Pan', () => {
  it('minimum 0.5 kg', () => {
    expect(calculateShoppingList([p('nino')], cfg).pan.kg).toBeGreaterThanOrEqual(0.5)
  })
  it('4 personas = 600g → 0.6 kg', () => {
    expect(calculateShoppingList(Array.from({ length: 4 }, () => p('hombre')), cfg).pan.kg).toBe(0.6)
  })
})

// ── Empty participants ─────────────────────────────────────────────────────────
describe('Empty participants', () => {
  it('returns safe defaults', () => {
    const result = calculateShoppingList([], cfg)
    expect(result.totalParticipants).toBe(0)
    expect(result.carne.kg).toBeGreaterThanOrEqual(1)
    expect(result.limon.units).toBe(6)
    expect(result.cerveza.liters).toBe(0)
    expect(result.cerveza.breakdown).toHaveLength(0)
  })
})
