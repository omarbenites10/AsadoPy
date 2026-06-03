'use client'

import { motion } from 'framer-motion'
import { Flame, CheckCircle, Copy, Trash2, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SavedAsado } from '@/types'

interface AsadoCardProps {
  asado: SavedAsado
  onOpen: (asado: SavedAsado) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('es-PY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

export function AsadoCard({ asado, onOpen, onDuplicate, onDelete }: AsadoCardProps) {
  const isFinished = asado.status === 'finalizado'
  const drinkers = asado.participants.filter((p) => p.drinksAlcohol).length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl border bg-[hsl(var(--card-bg))] p-4 flex flex-col gap-3 transition-all ${
        isFinished
          ? 'border-[hsl(var(--border))] opacity-80'
          : 'border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isFinished
              ? 'bg-[hsl(var(--secondary))]'
              : 'bg-gradient-to-br from-orange-400 to-red-500'
          }`}
        >
          {isFinished ? (
            <CheckCircle className="h-5 w-5 text-[hsl(var(--muted-fg))]" />
          ) : (
            <Flame className="h-5 w-5 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate">{asado.name}</span>
            {isFinished ? (
              <span className="shrink-0 text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--muted-fg))] px-2 py-0.5 rounded-full">
                Finalizado
              </span>
            ) : (
              <span className="shrink-0 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-fg))]">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {asado.participants.length} participante{asado.participants.length !== 1 ? 's' : ''}
              {drinkers > 0 && ` · ${drinkers} bebedor${drinkers !== 1 ? 'es' : ''}`}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-fg))] mt-0.5">
            {isFinished && asado.finishedAt
              ? `Finalizado el ${formatDate(asado.finishedAt)}`
              : `Guardado el ${formatDate(asado.updatedAt)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isFinished ? (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpen(asado)}>
              Ver lista
            </Button>
            <Button size="sm" className="flex-1" onClick={() => onDuplicate(asado.id)}>
              <Copy className="h-3.5 w-3.5" /> Duplicar
            </Button>
          </>
        ) : (
          <Button className="flex-1 h-9" onClick={() => onOpen(asado)}>
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--destructive))]"
          aria-label="Eliminar asado"
          onClick={() => onDelete(asado.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
