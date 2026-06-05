'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { FileSpreadsheet, MessageCircle, Plus, X, Save, Trash2, CheckCircle2, Circle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateCostSplit, EMPTY_PRICES } from '@/lib/cost-split'
import type { ItemPrices, Discount, ParticipantCost, ParticipantPayment } from '@/lib/cost-split'
import type { Participant, ConsumptionConfig, ShoppingList, Sex } from '@/types'
import { WHATSAPP_NUMBER } from '@/types'
import { generateId } from '@/lib/utils'
import { useCostSplit } from '@/hooks/useCostSplit'
import { useContacts } from '@/hooks/useContacts'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

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

function roundUp500(amount: number): number {
  return Math.ceil(amount / 500) * 500
}

function toWaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('595')) return digits
  if (digits.startsWith('0')) return '595' + digits.slice(1)
  return '595' + digits
}

function buildPersonalMessage(sex: Sex, drinksAlcohol: boolean, rounded: number): string {
  const amount = rounded.toLocaleString('es-PY')
  if (sex === 'mujer') {
    return drinksAlcohol
      ? `Hola queridaa, me podrias transferir ${amount}gs porfis. Es para el asado y la birra`
      : `Hola queridaa, me podrias transferir ${amount}gs porfis. Es para el asado`
  }
  return drinksAlcohol
    ? `Hola pai, me podrias transferir ${amount}gs porfis. Es para el asado y la birra`
    : `Hola pai, me podrias transferir ${amount}gs porfis. Es para el asado`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  participants: Participant[]
  config: ConsumptionConfig
  list: ShoppingList
  asadoName?: string
  asadoId?: string
}

export function CostSplitterDialog({
  open, onOpenChange, participants, config, list, asadoName, asadoId,
}: Props) {
  const { data: savedData, save, updatePayment, remove } = useCostSplit(asadoId ?? null)
  const { contacts } = useContacts()

  const [prices, setPrices] = useState<ItemPrices>(EMPTY_PRICES)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const initializedRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!open) { initializedRef.current = undefined; return }
    if (initializedRef.current === asadoId) return
    initializedRef.current = asadoId
    if (savedData) {
      setPrices(savedData.prices)
      setDiscounts(savedData.discounts)
    } else {
      setPrices(EMPTY_PRICES)
      setDiscounts([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asadoId])

  const visibleFields = PRICE_FIELDS.filter(({ key }) => {
    if (key === 'cerveza' || key === 'hielo') return list.drinkers > 0
    if (key === 'bebidasSinAlcohol') return list.nonDrinkers > 0
    return true
  })

  const subtotal = Object.values(prices).reduce((s, v) => s + v, 0)
  const totalDiscounts = discounts.reduce((s, d) => s + d.amount, 0)
  const finalTotal = subtotal + totalDiscounts

  // Enrich participants with isSelf from current contact data (handles participants added before isSelf was tracked)
  const enrichedParticipants = useMemo(() =>
    participants.map(p => ({
      ...p,
      isSelf: p.isSelf ||
        contacts.find(c => c.id === p.contactId)?.isSelf ||
        contacts.find(c => c.name.trim().toLowerCase() === p.name.trim().toLowerCase())?.isSelf ||
        false,
    })),
    [participants, contacts]
  )

  const results = useMemo(
    () => calculateCostSplit(enrichedParticipants, config, prices, discounts),
    [enrichedParticipants, config, prices, discounts]
  )

  const selfParticipantIds = useMemo(
    () => new Set(enrichedParticipants.filter(p => p.isSelf).map(p => p.id)),
    [enrichedParticipants]
  )

  function isParticipantSelf(resultId: string): boolean {
    return selfParticipantIds.has(resultId)
  }

  const hasResults = subtotal > 0 && results.length > 0
  const isSaved = savedData !== null

  // ── Phone lookup ─────────────────────────────────────────────────────────────

  function getParticipantPhone(resultId: string): string | undefined {
    const p = participants.find(pt => pt.id === resultId)
    if (!p) return undefined

    // Primary: match by contactId
    if (p.contactId) {
      const phone = contacts.find(c => c.id === p.contactId)?.phone
      if (phone) return phone
    }

    // Fallback: match by exact name (handles manually-added participants)
    const byName = contacts.find(
      c => c.name.trim().toLowerCase() === p.name.trim().toLowerCase()
    )
    return byName?.phone || undefined
  }

  function getParticipantMeta(resultId: string): { sex: Sex; drinksAlcohol: boolean } {
    const p = participants.find(pt => pt.id === resultId)
    return { sex: p?.sex ?? 'hombre', drinksAlcohol: p?.drinksAlcohol ?? false }
  }

  // ── Prices ───────────────────────────────────────────────────────────────────

  function handlePriceChange(key: keyof ItemPrices, raw: string) {
    const val = parseInt(raw, 10)
    setPrices(prev => ({ ...prev, [key]: isNaN(val) || val < 0 ? 0 : val }))
  }

  // ── Discounts ─────────────────────────────────────────────────────────────────

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

  // ── Save / Delete ─────────────────────────────────────────────────────────────

  function handleSave() {
    if (!asadoId || !hasResults) return
    const existingPayments = savedData?.payments ?? []
    const payments: ParticipantPayment[] = results
      .filter(r => !isParticipantSelf(r.id))
      .map(r => {
        const existing = existingPayments.find(p => p.participantId === r.id)
        const amountDue = Math.round(r.total)
        return existing
          ? { ...existing, amountDue, name: r.name }
          : { participantId: r.id, name: r.name, amountDue, amountPaid: amountDue, isPaid: false }
      })
    save(prices, discounts, payments)
    toast({ title: isSaved ? 'Distribución actualizada' : 'Distribución guardada' })
  }

  function handleDelete() {
    remove()
    setPrices(EMPTY_PRICES)
    setDiscounts([])
    toast({ title: 'Distribución eliminada' })
  }

  // ── Payments ─────────────────────────────────────────────────────────────────

  function handleTogglePaid(participantId: string, currentIsPaid: boolean, amountDue: number) {
    updatePayment(participantId, { isPaid: !currentIsPaid, amountPaid: amountDue })
  }

  function handleAmountPaidChange(participantId: string, raw: string) {
    const val = parseInt(raw, 10)
    updatePayment(participantId, { amountPaid: isNaN(val) || val < 0 ? 0 : val })
  }

  // ── Group WhatsApp ────────────────────────────────────────────────────────────

  function buildGroupWhatsAppText(): string {
    const title = asadoName ?? 'Asado'
    const lines = [`💰 Distribución de costos - ${title}`, '']
    for (const r of results) {
      if (!isParticipantSelf(r.id)) lines.push(`👤 ${r.name}: Gs. ${fmt(r.total)}`)
    }
    lines.push('', `💵 Total: Gs. ${fmt(finalTotal)}`)
    return lines.join('\n')
  }

  function handleShareWhatsApp() {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildGroupWhatsAppText())}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // ── Excel ─────────────────────────────────────────────────────────────────────

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

    if (discounts.length > 0) {
      rows.push(['Subtotal', '', fmt(subtotal)])
      for (const d of discounts) rows.push([d.label || 'Descuento', '', fmt(d.amount)])
      rows.push(['Total', '', fmt(finalTotal)], [])
    }

    rows.push(['Participante', ...visibleFields.map(f => f.label), 'Total (Gs.)', 'Se solicita (Gs.)'])

    for (const r of results) {
      rows.push([
        r.name,
        ...visibleFields.map(f => Math.round(r[f.key] as number)),
        Math.round(r.total),
        roundUp500(r.total),
      ])
    }

    rows.push([
      'TOTAL',
      ...visibleFields.map(f => Math.round(results.reduce((s, r) => s + (r[f.key] as number), 0))),
      Math.round(results.reduce((s, r) => s + r.total, 0)),
      results.reduce((s, r) => s + roundUp500(r.total), 0),
    ])

    const payableSaved = (savedData?.payments ?? []).filter(p => !selfParticipantIds.has(p.participantId))
    if (payableSaved.length) {
      rows.push([], ['Estado de pagos'], ['Participante', 'Debe (Gs.)', 'Pagó (Gs.)', 'Diferencia (Gs.)', 'Estado'])
      for (const p of payableSaved) {
        const currentResult = results.find(r => r.id === p.participantId)
        const amountDue = currentResult ? Math.round(currentResult.total) : p.amountDue
        const effectivePaid = p.isPaid ? p.amountPaid : 0
        const diff = p.isPaid ? effectivePaid - amountDue : 0
        rows.push([p.name, amountDue, effectivePaid, diff, p.isPaid ? 'Pagado' : 'Pendiente'])
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 22 }, ...visibleFields.map(() => ({ wch: 14 })), { wch: 14 }, { wch: 16 }]
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: ncols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: ncols - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: ncols - 1 } },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Distribución de Costos')
    XLSX.writeFile(wb, `AsadoPy - Costos - ${title}.xlsx`)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Distribución de costos
            {isSaved && (
              <span className="text-xs font-normal bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Guardado
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Ingresá el precio total de cada producto y los descuentos del ticket.
          </DialogDescription>
        </DialogHeader>

        {/* ── Price inputs ─────────────────────────────────────── */}
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

        {/* ── Discounts ────────────────────────────────────────── */}
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
                aria-label="Eliminar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* ── Ticket summary ───────────────────────────────────── */}
        {(subtotal > 0 || discounts.some(d => d.amount !== 0)) && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-fg))]">Subtotal</span>
              <span className="font-medium tabular-nums">Gs. {fmt(subtotal)}</span>
            </div>
            {discounts.map(d => d.amount !== 0 && (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--muted-fg))] truncate flex-1 min-w-0 mr-4">
                  {d.label || 'Descuento'}
                </span>
                <span className={cn('font-medium tabular-nums shrink-0', d.amount < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500')}>
                  Gs. {d.amount > 0 ? '+' : ''}{fmt(d.amount)}
                </span>
              </div>
            ))}
            <div className="border-t border-[hsl(var(--border))] pt-1.5 mt-0.5 flex items-center justify-between">
              <span className="font-bold text-sm">Total</span>
              <span className="font-bold text-sm text-[hsl(var(--primary))] tabular-nums">
                Gs. {fmt(finalTotal)}
              </span>
            </div>
          </div>
        )}

        {/* ── Save / Delete ────────────────────────────────────── */}
        {asadoId && hasResults && (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {isSaved ? 'Actualizar distribución' : 'Guardar distribución'}
            </Button>
            {isSaved && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                aria-label="Eliminar distribución guardada"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* ── Distribution + payment ───────────────────────────── */}
        {hasResults && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--muted-fg))] font-medium px-1">
                Distribución por persona
              </span>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="flex flex-col gap-2.5">
              {results.map(r => {
                const self = isParticipantSelf(r.id)
                const { sex, drinksAlcohol } = getParticipantMeta(r.id)
                const phone = self ? undefined : getParticipantPhone(r.id)
                const rounded = roundUp500(r.total)
                const waUrl = phone
                  ? `https://wa.me/${toWaPhone(phone)}?text=${encodeURIComponent(buildPersonalMessage(sex, drinksAlcohol, rounded))}`
                  : null
                const payment = self ? null : (savedData?.payments.find(p => p.participantId === r.id) ?? null)
                return (
                  <ParticipantCostCard
                    key={r.id}
                    result={r}
                    visibleFields={visibleFields}
                    rounded={rounded}
                    waUrl={waUrl}
                    payment={payment}
                    onTogglePaid={handleTogglePaid}
                    onAmountPaidChange={handleAmountPaidChange}
                    isSelf={self}
                  />
                )
              })}
            </div>

            {isSaved && savedData && <PaymentSummary payments={savedData.payments} />}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function ParticipantCostCard({
  result,
  visibleFields,
  rounded,
  waUrl,
  payment,
  onTogglePaid,
  onAmountPaidChange,
  isSelf,
}: {
  result: ParticipantCost
  visibleFields: { key: keyof ItemPrices; icon: string; label: string }[]
  rounded: number
  waUrl: string | null
  payment: ParticipantPayment | null
  onTogglePaid: (id: string, current: boolean, due: number) => void
  onAmountPaidChange: (id: string, raw: string) => void
  isSelf?: boolean
}) {
  const amountDue = Math.round(result.total)
  const diff = payment ? payment.amountPaid - payment.amountDue : 0

  if (isSelf) {
    return (
      <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-[hsl(var(--card-bg))] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{result.name}</span>
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              Yo
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-bold text-sm text-[hsl(var(--muted-fg))]">Sin costo</span>
            <span className="text-xs text-[hsl(var(--muted-fg))]">Cubierto por el grupo</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-3.5">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 pt-0.5">
          {payment && (
            payment.isPaid
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              : <Circle className="h-4 w-4 text-[hsl(var(--muted-fg))] shrink-0" />
          )}
          <span className="font-semibold text-sm truncate">{result.name}</span>
        </div>

        {/* Amount + WhatsApp pill */}
        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
          <span className="font-bold text-base text-[hsl(var(--primary))] tabular-nums">
            Gs. {Math.round(result.total).toLocaleString('es-PY')}
          </span>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-medium px-2 py-0.5 rounded-full transition-colors tabular-nums"
              aria-label={`Enviar WhatsApp a ${result.name}`}
            >
              <MessageCircle className="h-3 w-3 shrink-0" />
              {rounded.toLocaleString('es-PY')}
            </a>
          ) : (
            <span className="text-xs text-[hsl(var(--muted-fg))] italic">Sin teléfono</span>
          )}
        </div>
      </div>

      {/* Breakdown */}
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

      {/* Payment row */}
      {payment && (
        <div className="border-t border-[hsl(var(--border))] mt-2 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onTogglePaid(result.id, payment.isPaid, amountDue)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                payment.isPaid
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-fg))] hover:bg-orange-100 dark:hover:bg-orange-900/20'
              )}
            >
              {payment.isPaid
                ? <><CheckCircle2 className="h-3 w-3" /> Pagado</>
                : <><Circle className="h-3 w-3" /> Pendiente</>
              }
            </button>

            {payment.isPaid && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-[hsl(var(--muted-fg))]">Pagó Gs.</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={payment.amountPaid === 0 ? '' : payment.amountPaid}
                  onChange={e => onAmountPaidChange(result.id, e.target.value)}
                  className="w-24 text-right h-8 text-xs"
                />
                {diff !== 0 && (
                  <span className={cn(
                    'text-xs font-semibold tabular-nums shrink-0',
                    diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  )}>
                    {diff > 0 ? '+' : ''}{Math.round(diff).toLocaleString('es-PY')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentSummary({ payments }: { payments: ParticipantPayment[] }) {
  const paid = payments.filter(p => p.isPaid)
  const totalDue = payments.reduce((s, p) => s + p.amountDue, 0)
  const totalCollected = paid.reduce((s, p) => s + p.amountPaid, 0)
  const progress = payments.length > 0 ? paid.length / payments.length : 0

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold">
            {paid.length} de {payments.length} pagaron
          </p>
          <p className="text-xs text-[hsl(var(--muted-fg))]">
            Cobrado: Gs. {Math.round(totalCollected).toLocaleString('es-PY')} / Gs. {Math.round(totalDue).toLocaleString('es-PY')}
          </p>
        </div>
        {totalCollected !== totalDue && paid.length > 0 && (
          <span className={cn(
            'text-xs font-semibold tabular-nums',
            totalCollected - totalDue > 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {totalCollected - totalDue > 0 ? '+' : ''}
            {Math.round(totalCollected - totalDue).toLocaleString('es-PY')}
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-[hsl(var(--border))]">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  )
}
