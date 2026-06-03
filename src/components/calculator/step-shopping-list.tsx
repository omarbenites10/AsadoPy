'use client'

import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Share2,
  RefreshCw,
  ShoppingCart,
  Beef,
  Package,
  Beer,
  Flame,
  Snowflake,
  Salad,
  Wind,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ShoppingList } from '@/types'

interface ShoppingItemProps {
  icon: React.ReactNode
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
        {subValue && (
          <p className="text-xs text-[hsl(var(--muted-fg))] mt-0.5">{subValue}</p>
        )}
      </div>
      <span className="font-bold text-sm text-right shrink-0">{value}</span>
    </motion.div>
  )
}

interface StepShoppingListProps {
  list: ShoppingList
  onBack: () => void
  onReset: () => void
}

function formatKg(kg: number): string {
  return `${Number.isInteger(kg * 10) ? kg.toFixed(1) : kg} kg`
}

export function StepShoppingList({ list, onBack, onReset }: StepShoppingListProps) {
  const {
    carne,
    chorizo,
    cerveza,
    mandioca,
    pan,
    carbon,
    panDeAjo,
    sopaParaguaya,
    hielo,
    limon,
    bebidasSinAlcohol,
    mbeju,
    totalParticipants,
    drinkers,
    nonDrinkers,
  } = list

  const capacityDisplay = cerveza.unit === 'ml'
    ? `${cerveza.capacity} ml`
    : `${cerveza.capacity} L`

  function buildShareText(): string {
    const lines = [
      '🔥 Lista de compras - AsadoPy',
      `👥 ${totalParticipants} persona${totalParticipants !== 1 ? 's' : ''}`,
      '',
      `🥩 Carne: ${formatKg(carne.kg)}`,
      `🌭 Chorizo: ${formatKg(chorizo.kg)}`,
    ]
    if (drinkers > 0) {
      lines.push(`🍺 Cerveza: ${cerveza.liters} litros (${cerveza.units} ${cerveza.containerLabel} de ${capacityDisplay})`)
    }
    lines.push(
      `🫙 Mandioca: ${mandioca.bags} bolsa${mandioca.bags !== 1 ? 's' : ''} de 1 kg`,
      `🍞 Pan: ${formatKg(pan.kg)}`,
    )
    const carbonParts = []
    if (carbon.bags5kg > 0) carbonParts.push(`${carbon.bags5kg} bolsa${carbon.bags5kg !== 1 ? 's' : ''} de 5 kg`)
    if (carbon.bags3kg > 0) carbonParts.push(`${carbon.bags3kg} bolsa${carbon.bags3kg !== 1 ? 's' : ''} de 3 kg`)
    lines.push(`⚫ Carbón: ${carbonParts.join(' + ')}`)
    lines.push(
      `🧄 Pan de ajo: ${panDeAjo.packages} paquete${panDeAjo.packages !== 1 ? 's' : ''}`,
      `🫓 Sopa paraguaya: ${sopaParaguaya.packages} paquete${sopaParaguaya.packages !== 1 ? 's' : ''}`,
      `🧊 Hielo: ${hielo.bags} bolsa${hielo.bags !== 1 ? 's' : ''} de 3 kg`,
      `🍋 Limón: ${limon.units} unidades`,
    )
    if (nonDrinkers > 0) {
      lines.push(`🥤 Bebidas sin alcohol: ${bebidasSinAlcohol.liters} litros`)
    }
    lines.push(
      `🥐 Mbeju: ${mbeju.packages} paquete${mbeju.packages !== 1 ? 's' : ''}`,
      '',
      '🥗 Ensalada: Llevar ensalada. Se recomienda que alguien del grupo la prepare.',
      '',
      'Calculado con AsadoPy 🔥',
    )
    return lines.join('\n')
  }

  async function handleShare() {
    const text = buildShareText()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lista de compras - AsadoPy', text })
      } catch {
        await navigator.clipboard.writeText(text)
      }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Lista copiada al portapapeles')
    }
  }

  const carbonParts: string[] = []
  if (carbon.bags5kg > 0) carbonParts.push(`${carbon.bags5kg} bolsa${carbon.bags5kg !== 1 ? 's' : ''} de 5 kg`)
  if (carbon.bags3kg > 0) carbonParts.push(`${carbon.bags3kg} bolsa${carbon.bags3kg !== 1 ? 's' : ''} de 3 kg`)

  return (
    <div className="flex flex-col gap-4">
      {/* Header summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold text-lg">Lista de compras</span>
        </div>
        <p className="text-orange-100 text-sm">
          {totalParticipants} persona{totalParticipants !== 1 ? 's' : ''}
          {drinkers > 0 && ` · ${drinkers} bebedor${drinkers !== 1 ? 'es' : ''}`}
          {nonDrinkers > 0 && ` · ${nonDrinkers} sin alcohol`}
        </p>
      </motion.div>

      {/* Shopping items card */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] divide-y divide-[hsl(var(--border))] px-5">
        <ShoppingItem
          icon="🥩"
          label="Carne"
          value={formatKg(carne.kg)}
          delay={0.05}
        />
        <ShoppingItem
          icon="🌭"
          label="Chorizo"
          value={formatKg(chorizo.kg)}
          delay={0.08}
        />
        {drinkers > 0 && (
          <ShoppingItem
            icon="🍺"
            label="Cerveza"
            value={`${cerveza.liters} litros`}
            subValue={`${cerveza.units} ${cerveza.containerLabel}${cerveza.units !== 1 ? 's' : ''} de ${capacityDisplay}`}
            delay={0.11}
          />
        )}
        <ShoppingItem
          icon="🫙"
          label="Mandioca"
          value={`${mandioca.bags} bolsa${mandioca.bags !== 1 ? 's' : ''} de 1 kg`}
          delay={0.14}
        />
        <ShoppingItem
          icon="🍞"
          label="Pan"
          value={formatKg(pan.kg)}
          delay={0.17}
        />
        <ShoppingItem
          icon="⚫"
          label="Carbón"
          value={carbonParts.join(' + ')}
          subValue={`Total: ${carbon.totalKg} kg (necesita ${carbon.neededKg} kg)`}
          delay={0.20}
        />
        <ShoppingItem
          icon="🧄"
          label="Pan de ajo"
          value={`${panDeAjo.packages} paquete${panDeAjo.packages !== 1 ? 's' : ''} de 400 g`}
          delay={0.23}
        />
        <ShoppingItem
          icon="🫓"
          label="Sopa paraguaya"
          value={`${sopaParaguaya.packages} paquete${sopaParaguaya.packages !== 1 ? 's' : ''} de 1 kg`}
          delay={0.26}
        />
        <ShoppingItem
          icon="🧊"
          label="Hielo"
          value={`${hielo.bags} bolsa${hielo.bags !== 1 ? 's' : ''} de 3 kg`}
          delay={0.29}
        />
        <ShoppingItem
          icon="🍋"
          label="Limón"
          value={`${limon.units} unidades`}
          delay={0.32}
        />
        {nonDrinkers > 0 && (
          <ShoppingItem
            icon="🥤"
            label="Bebidas sin alcohol"
            value={`${bebidasSinAlcohol.liters} litros`}
            delay={0.35}
          />
        )}
        <ShoppingItem
          icon="🥐"
          label="Mbeju"
          value={`${mbeju.packages} paquete${mbeju.packages !== 1 ? 's' : ''} de 1 kg`}
          delay={0.38}
        />
      </div>

      {/* Ensalada note */}
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

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 no-print">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Configurar
        </Button>
        <Button onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>
      <Button variant="ghost" className="text-[hsl(var(--muted-fg))] no-print" onClick={onReset}>
        <RefreshCw className="h-4 w-4" />
        Nuevo asado
      </Button>
    </div>
  )
}
