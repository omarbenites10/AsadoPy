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
import type { Contact, Sex } from '@/types'
import { SEX_LABELS } from '@/types'

interface ContactFormProps {
  initialData?: Partial<Contact>
  onSubmit: (data: Omit<Contact, 'id' | 'createdAt'>) => void
  onCancel: () => void
  submitLabel?: string
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
    onSubmit({
      name: name.trim(),
      sex,
      drinksAlcohol: sex === 'nino' ? false : drinksAlcohol,
      phone: phone.trim(),
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
              <SelectItem key={s} value={s}>
                {SEX_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Consume alcohol</span>
          {sex === 'nino' && (
            <span className="text-xs text-[hsl(var(--muted-fg))]">
              Prohibido para niños
            </span>
          )}
        </div>
        <Switch
          checked={drinksAlcohol}
          onCheckedChange={setDrinksAlcohol}
          disabled={sex === 'nino'}
          aria-label="Consume alcohol"
        />
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
