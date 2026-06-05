'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, RefreshCw, ShoppingCart, Save,
  CheckCircle, MessageCircle, FileSpreadsheet, Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CostSplitterDialog } from './cost-splitter-dialog'
import type { ShoppingList, Participant, ConsumptionConfig } from '@/types'
import { WHATSAPP_NUMBER, SEX_LABELS, ALCOHOL_LEVEL_LABELS, ALCOHOL_LEVEL_LITERS } from '@/types'

interface ShoppingItemProps {
  icon: string
  label: string
  value: string
  subValue?: string
  delay?: number
}

function ShoppingItem({ icon, label, value, subValue, delay = 0 }: ShoppingItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 py-3"
    >
      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[hsl(var(--muted-fg))]">{label}</span>
        {subValue && <p className="text-xs text-[hsl(var(--muted-fg))] mt-0.5">{subValue}</p>}
      </div>
      <span className="font-bold text-sm text-right shrink-0">{value}</span>
    </motion.div>
  )
}

export interface StepShoppingListProps {
  list: ShoppingList
  participants: Participant[]
  config: ConsumptionConfig
  asadoName?: string
  onBack: () => void
  onReset: () => void
  onSave: () => void
  onFinish?: () => void
  isSaved?: boolean
  isFinished?: boolean
}

function formatKg(kg: number): string {
  return `${Number.isInteger(kg * 10) ? kg.toFixed(1) : kg} kg`
}

export function StepShoppingList({
  list,
  participants,
  config,
  asadoName,
  onBack,
  onReset,
  onSave,
  onFinish,
  isSaved = false,
  isFinished = false,
}: StepShoppingListProps) {
  const [costSplitterOpen, setCostSplitterOpen] = useState(false)
  const {
    carne, chorizo, cerveza, mandioca, pan, carbon, panDeAjo,
    sopaParaguaya, hielo, limon, bebidasSinAlcohol, mbeju,
    totalParticipants, drinkers, nonDrinkers,
  } = list

  const capacityDisplay = cerveza.unit === 'ml'
    ? `${cerveza.capacity} ml`
    : `${cerveza.capacity} L`

  const carbonParts: string[] = []
  if (carbon.bags5kg > 0) carbonParts.push(`${carbon.bags5kg} bolsa${carbon.bags5kg !== 1 ? 's' : ''} de 5 kg`)
  if (carbon.bags3kg > 0) carbonParts.push(`${carbon.bags3kg} bolsa${carbon.bags3kg !== 1 ? 's' : ''} de 3 kg`)

  // ── WhatsApp ──────────────────────────────────────────────────────────────────
  function buildShareText(): string {
    const lines: string[] = [
      '🔥 Lista de compras - AsadoPy',
      '',
      `👥 ${totalParticipants} persona${totalParticipants !== 1 ? 's' : ''}`,
      '',
      `🥩 Carne: ${formatKg(carne.kg)}`,
      `🌭 Chorizo: ${formatKg(chorizo.kg)}`,
    ]

    if (drinkers > 0) {
      lines.push(
        `🍺 Cerveza: ${cerveza.liters} litros (${cerveza.units} ${cerveza.containerLabel}${cerveza.units !== 1 ? 's' : ''} de ${capacityDisplay})`
      )
    }

    lines.push(
      `🫙 Mandioca: ${mandioca.bags} bolsa${mandioca.bags !== 1 ? 's' : ''} de 1 kg`,
      `🍞 Pan: ${formatKg(pan.kg)}`,
      `⚫ Carbón: ${carbonParts.join(' + ')}`,
      `🧄 Pan de ajo: ${panDeAjo.packages} paquete${panDeAjo.packages !== 1 ? 's' : ''} de 400 g`,
      `🫓 Sopa paraguaya: ${sopaParaguaya.packages} paquete${sopaParaguaya.packages !== 1 ? 's' : ''} de 1 kg`,
      `🧊 Hielo: ${hielo.bags} bolsa${hielo.bags !== 1 ? 's' : ''} de 3 kg`,
      `🍋 Limón: ${limon.units} unidades`,
    )

    if (nonDrinkers > 0) {
      lines.push(`🥤 Bebidas sin alcohol: ${bebidasSinAlcohol.liters} litros`)
    }

    lines.push(
      `🥐 Mbeju: ${mbeju.packages} paquete${mbeju.packages !== 1 ? 's' : ''} de 1 kg`,
      '',
      '🥗 Ensalada: llevar, es difícil estimar cantidades.',
    )

    return lines.join('\n')
  }

  function handleShareWhatsApp() {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildShareText())}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // ── Excel ─────────────────────────────────────────────────────────────────────
  async function handleExportExcel() {
    const XLSX = (await import('xlsx')).default ?? (await import('xlsx'))

    const title = asadoName ?? 'AsadoPy'
    const date = new Date().toLocaleDateString('es-PY', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    type Row = (string | number)[]

    const rows: Row[] = [
      ['Lista de Compras - AsadoPy'],
      [title],
      [date],
      [],
      [`Participantes: ${totalParticipants}${drinkers > 0 ? ` (${drinkers} con alcohol, ${nonDrinkers} sin alcohol)` : ''}`],
      [],
      ['Producto', 'Cantidad', 'Unidad'],
      ['Carne', carne.kg, 'kg'],
      ['Chorizo', chorizo.kg, 'kg'],
    ]

    if (drinkers > 0) {
      rows.push(['Cerveza', cerveza.liters, `litros (${cerveza.units} ${cerveza.containerLabel}${cerveza.units !== 1 ? 's' : ''} de ${capacityDisplay})`])
    }

    rows.push(
      ['Mandioca', mandioca.bags, `bolsa${mandioca.bags !== 1 ? 's' : ''} de 1 kg`],
      ['Pan', pan.kg, 'kg'],
      ['Carbón', carbon.totalKg, `kg (${carbonParts.join(' + ')})`],
      ['Pan de ajo', panDeAjo.packages, `paquete${panDeAjo.packages !== 1 ? 's' : ''} de 400 g`],
      ['Sopa paraguaya', sopaParaguaya.packages, `paquete${sopaParaguaya.packages !== 1 ? 's' : ''} de 1 kg`],
      ['Hielo', hielo.bags, `bolsa${hielo.bags !== 1 ? 's' : ''} de 3 kg`],
      ['Limón', limon.units, 'unidades'],
    )

    if (nonDrinkers > 0) {
      rows.push(['Bebidas sin alcohol', bebidasSinAlcohol.liters, 'litros'])
    }

    rows.push(
      ['Mbeju', mbeju.packages, `paquete${mbeju.packages !== 1 ? 's' : ''} de 1 kg`],
      [],
      ['Ensalada', '-', 'Llevar. Es difícil estimar cantidades.'],
    )

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 38 }]

    // Merge title rows (A1:C1, A2:C2, A3:C3)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    ]

    // ── Participants sheet ────────────────────────────────────────────────────
    const pRows: Row[] = [
      ['Lista de Participantes'],
      [title],
      [date],
      [],
      [`Total: ${participants.length} persona${participants.length !== 1 ? 's' : ''}`],
      [],
      ['Nombre', 'Categoría', 'Alcohol', 'Nivel de consumo', 'Litros estimados'],
    ]
    for (const p of participants) {
      const drinks = p.drinksAlcohol && p.sex !== 'nino'
      pRows.push([
        p.name,
        SEX_LABELS[p.sex],
        drinks ? 'Sí' : 'No',
        drinks ? ALCOHOL_LEVEL_LABELS[p.alcoholLevel] : '-',
        drinks ? ALCOHOL_LEVEL_LITERS[p.alcoholLevel] : '-',
      ])
    }

    const wsP = XLSX.utils.aoa_to_sheet(pRows)
    wsP['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }]
    wsP['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras')
    XLSX.utils.book_append_sheet(wb, wsP, 'Participantes')
    XLSX.writeFile(wb, `AsadoPy - ${title}.xlsx`)
  }

  // ── Cerveza subtext ───────────────────────────────────────────────────────────
  const cervevaSubtext = drinkers > 0
    ? `${cerveza.units} ${cerveza.containerLabel}${cerveza.units !== 1 ? 's' : ''} de ${capacityDisplay}`
    : undefined

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold text-lg">Lista de compras</span>
          {isFinished && (
            <span className="ml-auto flex items-center gap-1 text-sm bg-white/20 rounded-full px-2 py-0.5">
              <CheckCircle className="h-3.5 w-3.5" /> Finalizado
            </span>
          )}
        </div>
        <p className="text-orange-100 text-sm">
          {totalParticipants} persona{totalParticipants !== 1 ? 's' : ''}
          {drinkers > 0 && ` · ${drinkers} bebedor${drinkers !== 1 ? 'es' : ''}`}
          {nonDrinkers > 0 && ` · ${nonDrinkers} sin alcohol`}
        </p>
      </motion.div>

      {/* Items */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] divide-y divide-[hsl(var(--border))] px-5">
        <ShoppingItem icon="🥩" label="Carne" value={formatKg(carne.kg)} delay={0.05} />
        <ShoppingItem icon="🌭" label="Chorizo" value={formatKg(chorizo.kg)} delay={0.08} />
        {drinkers > 0 && (
          <ShoppingItem
            icon="🍺"
            label="Cerveza"
            value={`${cerveza.liters} litros`}
            subValue={cervevaSubtext}
            delay={0.11}
          />
        )}
        <ShoppingItem icon="🫙" label="Mandioca" value={`${mandioca.bags} bolsa${mandioca.bags !== 1 ? 's' : ''} de 1 kg`} delay={0.14} />
        <ShoppingItem icon="🍞" label="Pan" value={formatKg(pan.kg)} delay={0.17} />
        <ShoppingItem
          icon="⚫"
          label="Carbón"
          value={carbonParts.join(' + ')}
          subValue={`Total: ${carbon.totalKg} kg (necesita ${carbon.neededKg} kg)`}
          delay={0.20}
        />
        <ShoppingItem icon="🧄" label="Pan de ajo" value={`${panDeAjo.packages} paquete${panDeAjo.packages !== 1 ? 's' : ''} de 400 g`} delay={0.23} />
        <ShoppingItem icon="🫓" label="Sopa paraguaya" value={`${sopaParaguaya.packages} paquete${sopaParaguaya.packages !== 1 ? 's' : ''} de 1 kg`} delay={0.26} />
        <ShoppingItem icon="🧊" label="Hielo" value={`${hielo.bags} bolsa${hielo.bags !== 1 ? 's' : ''} de 3 kg`} delay={0.29} />
        <ShoppingItem icon="🍋" label="Limón" value={`${limon.units} unidades`} delay={0.32} />
        {nonDrinkers > 0 && (
          <ShoppingItem icon="🥤" label="Bebidas sin alcohol" value={`${bebidasSinAlcohol.liters} litros`} delay={0.35} />
        )}
        <ShoppingItem icon="🥐" label="Mbeju" value={`${mbeju.packages} paquete${mbeju.packages !== 1 ? 's' : ''} de 1 kg`} delay={0.38} />
      </div>

      {/* Ensalada */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.42 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-4 flex items-start gap-3"
      >
        <span className="text-xl shrink-0">🥗</span>
        <div>
          <p className="text-sm font-semibold">Ensalada</p>
          <p className="text-xs text-[hsl(var(--muted-fg))] mt-1">
            Llevar ensalada. Se recomienda que alguien del grupo la prepare ya que es difícil estimar cantidades.
          </p>
        </div>
      </motion.div>

      {/* Share buttons — always visible */}
      <div className="grid grid-cols-2 gap-3 no-print">
        <Button onClick={handleShareWhatsApp} className="gap-2">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
        <Button variant="outline" onClick={handleExportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
      </div>

      {/* Cost distribution */}
      <Button
        variant="outline"
        onClick={() => setCostSplitterOpen(true)}
        className="gap-2 no-print"
      >
        <Calculator className="h-4 w-4" /> Distribución de costos
      </Button>

      <CostSplitterDialog
        open={costSplitterOpen}
        onOpenChange={setCostSplitterOpen}
        participants={participants}
        config={config}
        list={list}
        asadoName={asadoName}
      />

      {/* Navigation + save/finish */}
      {isFinished ? (
        <Button onClick={onReset} className="no-print">
          <RefreshCw className="h-4 w-4" /> Nuevo asado
        </Button>
      ) : (
        <div className="flex flex-col gap-2 no-print">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" /> Volver a configuración
          </Button>
          {!isSaved ? (
            <Button variant="secondary" onClick={onSave}>
              <Save className="h-4 w-4" /> Guardar asado
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onSave}>
                <Save className="h-4 w-4" /> Actualizar asado guardado
              </Button>
              {onFinish && (
                <Button variant="outline" onClick={onFinish}>
                  <CheckCircle className="h-4 w-4" /> Marcar como finalizado
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" className="text-[hsl(var(--muted-fg))] text-sm" onClick={onReset}>
            <RefreshCw className="h-4 w-4" /> Nuevo asado
          </Button>
        </div>
      )}
    </div>
  )
}
