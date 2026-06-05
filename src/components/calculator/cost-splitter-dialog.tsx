'use client'

import { useState, useMemo } from 'react'
import { FileSpreadsheet, MessageCircle, Plus, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateCostSplit, EMPTY_PRICES } from '@/lib/cost-split'
import type { ItemPrices, ParticipantCost, Discount } from '@/lib/cost-split'
import type { Participant, ConsumptionConfig, ShoppingList } from '@/types'
import { WHATSAPP_NUMBER } from '@/types'
import { generateId } from '@/lib/utils'

const PRICE_FIELDS: { key: keyof ItemPrices; icon: string; label: string }[] = [
  { key: 'carne', icon: '🥩', label: 'Carne' },
  { key: 'chorizo', icon: '🌭', label: 'Chorizo' },
  { key: 'cerveza', icon: '🍺', label: 'Cerveza' },
  { key: 'hielo', icon: '🧊', label: 'Hielo' },
  { key: 'mandioca', icon: '🫙', label: 'Mandioca' },
  { key: 'pan', icon: '🍞', label: 'Pan' },
  { key: 'carbon', icon: '⚫', label: 'Carbón' },
  { key: 'panDeAjo', icon: '🧄', label: 'Pan de ajo' },
  { key: 'sopaParaguaya', icon: '🫓', label: 'Sopa paraguaya' },
  { key: 'limon', icon: '🍋', label: 'Limón' },
  { key: 'bebidasSinAlcohol', icon: '🥤', label: 'Bebidas sin alcohol' },
  { key: 'mbeju', icon: '🥐', label: 'Mbeju' },
]

function fmt(n: number): string {
  return Math.round(n).toLocaleString('es-PY')
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  participants: Participant[]
  config: ConsumptionConfig
  list: ShoppingList
  asadoName?: string
}

export function CostSplitterDialog({
  open, onOpenChange, participants, config, list, asadoName,
}: Props) {
  const [prices, setPrices] = useState<ItemPrices>(EMPTY_PRICES)
  const [discounts, setDiscounts] = useState<Discount[]>([])

  const visibleFields = PRICE_FIELDS.filter(({ key }) => {
    if (key === 'cerveza' || key === 'hielo') return list.drinkers > 0
    if (key === 'bebidasSinAlcohol') return list.nonDrinkers > 0
    return true
  })

  const subtotal = Object.values(prices).reduce((s, v) => s + v, 0)
  const totalDiscounts = discounts.reduce((s, d) => s + d.amount, 0)
  const finalTotal = subtotal + totalDiscounts

  const results = useMemo(
    () => calculateCostSplit(participants, config, prices, discounts),
    [participants, config, prices, discounts]
  )

  const hasResults = subtotal > 0 && results.length > 0

  function handlePriceChange(key: keyof ItemPrices, raw: string) {
    const val = parseInt(raw, 10)
    setPrices(prev => ({ ...prev, [key]: isNaN(val) || val < 0 ? 0 : val }))
  }

  function addDiscount() {
    setDiscounts(prev => [...prev, { id: generateId(), label: '', amount: 0 }])
  }

  function updateDiscountLabel(id: string, label: string) {
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, label } : d))
  }

  function updateDiscountAmount(id: string, raw: string) {
    const val = parseInt(raw, 10)
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, amount: isNaN(val) ? 0 : val } : d))
  }

  function removeDiscount(id: string) {
    setDiscounts(prev => prev.filter(d => d.id !== id))
  }

  function buildWhatsAppText(): string {
    const title = asadoName ?? 'Asado'
    const lines = [`💰 Distribución de costos - ${title}`, '']
    for (const r of results) {
      lines.push(`👤 ${r.name}: Gs. ${fmt(r.total)}`)
    }
    lines.push('', `💵 Total: Gs. ${fmt(finalTotal)}`)
    return lines.join('\n')
  }

  function handleShareWhatsApp() {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppText())}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleExportExcel() {
    if (!hasResults) return
    const XLSX = (await import('xlsx')).default ?? (await import('xlsx'))
    const title = asadoName ?? 'AsadoPy'
    const date = new Date().toLocaleDateString('es-PY', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    type Row = (string | number)[]
    const ncols = visibleFields.length + 2

    const rows: Row[] = [
      ['Distribución de Costos - AsadoPy'],
      [title],
      [date],
      [],
    ]

    // Discounts summary in the sheet
    if (discounts.length > 0) {
      rows.push(['Subtotal', fmt(subtotal)])
      for (const d of discounts) {
        rows.push([d.label || 'Descuento', fmt(d.amount)])
      }
      rows.push(['Total', fmt(finalTotal)])
      rows.push([])
    }

    rows.push(['Participante', ...visibleFields.map(f => f.label), 'Total (Gs.)'])

    for (const r of results) {
      rows.push([
        r.name,
        ...visibleFields.map(f => Math.round(r[f.key] as number)),
        Math.round(r.total),
      ])
    }

    rows.push([
      'TOTAL',
      ...visibleFields.map(f =>
        Math.round(results.reduce((s, r) => s + (r[f.key] as number), 0))
      ),
      Math.round(results.reduce((s, r) => s + r.total, 0)),
    ])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 22 }, ...visibleFields.map(() => ({ wch: 14 })), { wch: 14 }]
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: ncols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: ncols - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: ncols - 1 } },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Distribución de Costos')
    XLSX.writeFile(wb, `AsadoPy - Costos - ${title}.xlsx`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle>Distribución de costos</DialogTitle>
          <DialogDescription>
            Ingresá el precio total de cada producto y los descuentos del ticket para calcular cuánto le corresponde a cada participante.
          </DialogDescription>
        </DialogHeader>

        {/* ── Price inputs ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          {visibleFields.map(({ key, icon, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-lg w-7 shrink-0 text-center">{icon}</span>
              <span className="text-sm flex-1 min-w-0 truncate">{label}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-[hsl(var(--muted-fg))] font-medium">Gs.</span>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={prices[key] === 0 ? '' : prices[key]}
                  onChange={e => handlePriceChange(key, e.target.value)}
                  className="w-28 text-right h-9 text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── Discounts ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Descuentos / Ajustes</span>
            <Button variant="ghost" size="sm" onClick={addDiscount} className="gap-1 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </Button>
          </div>

          {discounts.length === 0 && (
            <p className="text-xs text-[hsl(var(--muted-fg))] text-center py-1">
              Agregá los descuentos que aparecen en tu ticket
            </p>
          )}

          {discounts.map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <Input
                placeholder="Descripción (ej: Desc. Club Olimpia)"
                value={d.label}
                onChange={e => updateDiscountLabel(d.id, e.target.value)}
                className="flex-1 h-9 text-sm min-w-0"
              />
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-[hsl(var(--muted-fg))] font-medium">Gs.</span>
                <Input
                  type="number"
                  step="1"
                  placeholder="-50000"
                  value={d.amount === 0 ? '' : d.amount}
                  onChange={e => updateDiscountAmount(d.id, e.target.value)}
                  className="w-24 text-right h-9 text-sm"
                />
              </div>
              <button
                onClick={() => removeDiscount(d.id)}
                className="shrink-0 p-1 rounded-lg text-[hsl(var(--muted-fg))] hover:text-red-500 transition-colors"
                aria-label="Eliminar descuento"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* ── Ticket summary ──────────────────────────────────────────── */}
        {(subtotal > 0 || discounts.some(d => d.amount !== 0)) && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-fg))]">Subtotal</span>
              <span className="font-medium tabular-nums">Gs. {fmt(subtotal)}</span>
            </div>
            {discounts.map(d => (
              d.amount !== 0 && (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-fg))] truncate flex-1 min-w-0 mr-4">
                    {d.label || 'Descuento'}
                  </span>
                  <span className={`font-medium tabular-nums shrink-0 ${d.amount < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500'}`}>
                    Gs. {d.amount > 0 ? '+' : ''}{fmt(d.amount)}
                  </span>
                </div>
              )
            ))}
            <div className="border-t border-[hsl(var(--border))] pt-1.5 mt-0.5 flex items-center justify-between">
              <span className="font-bold text-sm">Total</span>
              <span className="font-bold text-sm text-[hsl(var(--primary))] tabular-nums">
                Gs. {fmt(finalTotal)}
              </span>
            </div>
          </div>
        )}

        {/* ── Per-person results ──────────────────────────────────────── */}
        {hasResults && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--muted-fg))] font-medium px-1">Distribución por persona</span>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="flex flex-col gap-2.5">
              {results.map(r => (
                <ParticipantCostCard key={r.id} result={r} visibleFields={visibleFields} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleShareWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          </>
        )}

        {!hasResults && subtotal === 0 && (
          <p className="text-center text-sm text-[hsl(var(--muted-fg))] py-4">
            Ingresá los precios para ver la distribución
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ParticipantCostCard({
  result,
  visibleFields,
}: {
  result: ParticipantCost
  visibleFields: { key: keyof ItemPrices; icon: string; label: string }[]
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{result.name}</span>
        <span className="font-bold text-base text-[hsl(var(--primary))]">
          Gs. {Math.round(result.total).toLocaleString('es-PY')}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {visibleFields.map(f => {
          const val = result[f.key] as number
          if (val < 0.5) return null
          return (
            <div key={f.key} className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-fg))]">{f.icon} {f.label}</span>
              <span className="text-xs font-medium tabular-nums">
                Gs. {Math.round(val).toLocaleString('es-PY')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
