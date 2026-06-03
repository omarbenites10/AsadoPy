'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import type { Contact, Sex, AlcoholLevel } from '@/types'
import { SEX_LABELS, ALCOHOL_LEVEL_LABELS, ALCOHOL_LEVEL_DESCRIPTIONS } from '@/types'

interface ContactFormProps {
  initialData?: Partial<Contact>
  onSubmit: (data: Omit<Contact, 'id' | 'createdAt'>) => void
  onCancel: () => void
  submitLabel?: string
}

const ALCOHOL_LEVELS: AlcoholLevel[] = ['tranquilo', 'normal', 'fuerte']
const LEVEL_EMOJI: Record<AlcoholLevel, string> = {
  tranquilo: '🍺',
  normal: '🍺🍺',
  fuerte: '🍺🍺🍺',
}

export function ContactForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: ContactFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [sex, setSex] = useState<Sex>(initialData?.sex ?? 'hombre')
  const [drinksAlcohol, setDrinksAlcohol] = useState(
    initialData?.sex === 'nino' ? false : (initialData?.drinksAlcohol ?? true)
  )
  const [alcoholLevel, setAlcoholLevel] = useState<AlcoholLevel>(
    initialData?.alcoholLevel ?? 'normal'
  )
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'El nombre es requerido'
    if (name.trim().length > 50) errs.name = 'Nombre demasiado largo (máx. 50 caracteres)'
    return errs
  }

  function handleSexChange(value: Sex) {
    setSex(value)
    if (value === 'nino') setDrinksAlcohol(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const drinks = sex === 'nino' ? false : drinksAlcohol
    onSubmit({
      name: name.trim(),
      sex,
      drinksAlcohol: drinks,
      alcoholLevel: drinks ? alcoholLevel : 'normal',
      phone: phone.trim(),
      isFavorite: initialData?.isFavorite ?? false,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-name">Nombre *</Label>
        <Input
          id="contact-name"
          placeholder="Ej: Juan Pérez"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
          }}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-[hsl(var(--destructive))]" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-sex">Sexo</Label>
        <Select value={sex} onValueChange={(v) => handleSexChange(v as Sex)}>
          <SelectTrigger id="contact-sex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SEX_LABELS) as Sex[]).map((s) => (
              <SelectItem key={s} value={s}>{SEX_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Consume alcohol</span>
            {sex === 'nino' && (
              <span className="text-xs text-[hsl(var(--muted-fg))]">Prohibido para niños</span>
            )}
          </div>
          <Switch
            checked={drinksAlcohol}
            onCheckedChange={setDrinksAlcohol}
            disabled={sex === 'nino'}
            aria-label="Consume alcohol"
          />
        </div>

        {drinksAlcohol && sex !== 'nino' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[hsl(var(--border))]">
            <Label className="text-xs text-[hsl(var(--muted-fg))]">
              Nivel de consumo de cerveza
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {ALCOHOL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAlcoholLevel(level)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-all ${
                    alcoholLevel === level
                      ? 'border-[hsl(var(--primary))] bg-orange-50 dark:bg-orange-950/30'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] hover:border-orange-300'
                  }`}
                >
                  <span className="text-sm">{LEVEL_EMOJI[level]}</span>
                  <span className="text-xs font-semibold leading-tight">
                    {ALCOHOL_LEVEL_LABELS[level]}
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-fg))]">
                    {ALCOHOL_LEVEL_DESCRIPTIONS[level]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-phone">Teléfono</Label>
        <Input
          id="contact-phone"
          type="tel"
          placeholder="Ej: 0981 123 456"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
