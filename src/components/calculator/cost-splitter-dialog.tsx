'use client'

import { useState, useMemo } from 'react'
import { FileSpreadsheet, MessageCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateCostSplit, EMPTY_PRICES } from '@/lib/cost-split'
import type { ItemPrices, ParticipantCost } from '@/lib/cost-split'
import type { Participant, ConsumptionConfig, ShoppingList } from '@/types'
import { WHATSAPP_NUMBER } from '@/types'

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

  const visibleFields = PRICE_FIELDS.filter(({ key }) => {
    if (key === 'cerveza' || key === 'hielo') return list.drinkers > 0
    if (key === 'bebidasSinAlcohol') return list.nonDrinkers > 0
    return true
  })

  const results = useMemo(
    () => calculateCostSplit(participants, config, prices),
    [participants, config, prices]
  )

  const totalEntered = Object.values(prices).reduce((s, v) => s + v, 0)
  const hasResults = totalEntered > 0 && results.length > 0

  function handleChange(key: keyof ItemPrices, raw: string) {
    const val = parseInt(raw, 10)
    setPrices(prev => ({ ...prev, [key]: isNaN(val) || val < 0 ? 0 : val }))
  }

  function buildWhatsAppText(): string {
    const title = asadoName ?? 'Asado'
    const lines = [`💰 Distribución de costos - ${title}`, '']
    for (const r of results) {
      lines.push(`👤 ${r.name}: Gs. ${fmt(r.total)}`)
    }
    const grandTotal = results.reduce((s, r) => s + r.total, 0)
    lines.push('', `💵 Total: Gs. ${fmt(grandTotal)}`)
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
      ['Participante', ...visibleFields.map(f => f.label), 'Total (Gs.)'],
    ]

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
            Ingresá el precio total de cada producto para calcular cuánto le corresponde a cada participante.
          </DialogDescription>
        </DialogHeader>

        {/* Price inputs */}
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
                  onChange={e => handleChange(key, e.target.value)}
                  className="w-28 text-right h-9 text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        {hasResults ? (
          <>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--muted-fg))] font-medium px-1">Distribución por persona</span>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="flex flex-col gap-2.5">
              {results.map(r => (
                <ParticipantCostCard key={r.id} result={r} visibleFields={visibleFields} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <Button onClick={handleShareWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-[hsl(var(--muted-fg))] py-6">
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
          Gs. {fmt(result.total)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {visibleFields.map(f => {
          const val = result[f.key] as number
          if (val < 0.5) return null
          return (
            <div key={f.key} className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-fg))]">{f.icon} {f.label}</span>
              <span className="text-xs font-medium tabular-nums">Gs. {fmt(val)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
