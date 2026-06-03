'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Participant, Sex, AlcoholLevel } from '@/types'
import { SEX_LABELS, ALCOHOL_LEVEL_LABELS, ALCOHOL_LEVEL_DESCRIPTIONS } from '@/types'

const SEX_COLORS = {
  hombre: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  mujer: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  nino: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const ALCOHOL_LEVELS: AlcoholLevel[] = ['tranquilo', 'normal', 'fuerte']
const LEVEL_EMOJI: Record<AlcoholLevel, string> = {
  tranquilo: '🍺',
  normal: '🍺🍺',
  fuerte: '🍺🍺🍺',
}

interface ParticipantCardProps {
  participant: Participant
  onUpdate: (id: string, data: Partial<Omit<Participant, 'id'>>) => void
  onRemove: (id: string) => void
}

export function ParticipantCard({ participant, onUpdate, onRemove }: ParticipantCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(participant.name)
  const [sex, setSex] = useState<Sex>(participant.sex)
  const [drinksAlcohol, setDrinksAlcohol] = useState(participant.drinksAlcohol)
  const [alcoholLevel, setAlcoholLevel] = useState<AlcoholLevel>(
    participant.alcoholLevel ?? 'normal'
  )

  const initials = participant.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  function handleSave() {
    if (!name.trim()) return
    const drinks = sex === 'nino' ? false : drinksAlcohol
    onUpdate(participant.id, {
      name: name.trim(),
      sex,
      drinksAlcohol: drinks,
      alcoholLevel: drinks ? alcoholLevel : 'normal',
    })
    setEditOpen(false)
  }

  function handleSexChange(v: Sex) {
    setSex(v)
    if (v === 'nino') setDrinksAlcohol(false)
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-3.5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 font-bold text-white text-sm">
          {initials || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{participant.name}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SEX_COLORS[participant.sex]}`}>
              {SEX_LABELS[participant.sex]}
            </span>
          </div>
          <div className="text-xs text-[hsl(var(--muted-fg))] mt-0.5">
            {participant.sex !== 'nino' && (
              participant.drinksAlcohol
                ? `${LEVEL_EMOJI[participant.alcoholLevel ?? 'normal']} ${ALCOHOL_LEVEL_LABELS[participant.alcoholLevel ?? 'normal']}`
                : '🚫 No toma'
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar ${participant.name}`}
            onClick={() => {
              setName(participant.name)
              setSex(participant.sex)
              setDrinksAlcohol(participant.drinksAlcohol)
              setAlcoholLevel(participant.alcoholLevel ?? 'normal')
              setEditOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-[hsl(var(--destructive))]"
            aria-label={`Quitar ${participant.name}`}
            onClick={() => onRemove(participant.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar para este asado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-fg))] -mt-2 mb-2">
            Los cambios solo aplican a este evento, no modificarán el contacto original.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sexo</Label>
              <Select value={sex} onValueChange={(v) => handleSexChange(v as Sex)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEX_LABELS) as Sex[]).map((s) => (
                    <SelectItem key={s} value={s}>{SEX_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Consume alcohol</span>
                <Switch
                  checked={drinksAlcohol}
                  onCheckedChange={setDrinksAlcohol}
                  disabled={sex === 'nino'}
                />
              </div>

              {drinksAlcohol && sex !== 'nino' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <Label className="text-xs text-[hsl(var(--muted-fg))]">Nivel de cerveza</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ALCOHOL_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setAlcoholLevel(level)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition-all ${
                          alcoholLevel === level
                            ? 'border-[hsl(var(--primary))] bg-orange-50 dark:bg-orange-950/30'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--card-bg))]'
                        }`}
                      >
                        <span className="text-sm">{LEVEL_EMOJI[level]}</span>
                        <span className="text-xs font-semibold">{ALCOHOL_LEVEL_LABELS[level]}</span>
                        <span className="text-xs text-[hsl(var(--muted-fg))]">
                          {ALCOHOL_LEVEL_DESCRIPTIONS[level]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!name.trim()}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
