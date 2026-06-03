'use client'

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import type { ConsumptionConfig, ContainerType, CapacityUnit } from '@/types'
import { CONTAINER_TYPE_LABELS } from '@/types'

interface StepConfigurationProps {
  config: ConsumptionConfig
  onUpdateCarne: (values: Partial<{ hombre: number; mujer: number; nino: number }>) => void
  onUpdateChorizo: (values: Partial<{ hombre: number; mujer: number; nino: number }>) => void
  onUpdateCerveza: (values: Partial<{ hombre: number; mujer: number; nino: number }>) => void
  onUpdateBeer: (values: Partial<ConsumptionConfig['beer']>) => void
  onReset: () => void
  onBack: () => void
  onNext: () => void
}

function NumericInput({
  value,
  onChange,
  min = 0,
  step = 50,
  suffix,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  step?: number
  suffix?: string
  label: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-[hsl(var(--muted-fg))]">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v >= min) onChange(v)
          }}
          className="pr-10"
          aria-label={label}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--muted-fg))]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-[hsl(var(--primary))] uppercase tracking-wide">
      {children}
    </h3>
  )
}

export function StepConfiguration({
  config,
  onUpdateCarne,
  onUpdateChorizo,
  onUpdateCerveza,
  onUpdateBeer,
  onReset,
  onBack,
  onNext,
}: StepConfigurationProps) {
  const [resetOpen, setResetOpen] = useState(false)
  const [beerCapacityStr, setBeerCapacityStr] = useState(String(config.beer.capacity))

  function handleCapacityBlur() {
    const v = parseFloat(beerCapacityStr)
    if (!isNaN(v) && v > 0) {
      onUpdateBeer({ capacity: v })
    } else {
      setBeerCapacityStr(String(config.beer.capacity))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Carne */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-4 flex flex-col gap-3">
        <SectionTitle>🥩 Carne por persona</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <NumericInput
            label="Hombre"
            value={config.carne.hombre}
            onChange={(v) => onUpdateCarne({ hombre: v })}
            step={50}
            suffix="g"
          />
          <NumericInput
            label="Mujer"
            value={config.carne.mujer}
            onChange={(v) => onUpdateCarne({ mujer: v })}
            step={50}
            suffix="g"
          />
          <NumericInput
            label="Niño"
            value={config.carne.nino}
            onChange={(v) => onUpdateCarne({ nino: v })}
            step={50}
            suffix="g"
          />
        </div>
      </div>

      {/* Chorizo */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-4 flex flex-col gap-3">
        <SectionTitle>🌭 Chorizo por persona</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <NumericInput
            label="Hombre"
            value={config.chorizo.hombre}
            onChange={(v) => onUpdateChorizo({ hombre: v })}
            step={50}
            suffix="g"
          />
          <NumericInput
            label="Mujer"
            value={config.chorizo.mujer}
            onChange={(v) => onUpdateChorizo({ mujer: v })}
            step={50}
            suffix="g"
          />
          <NumericInput
            label="Niño"
            value={config.chorizo.nino}
            onChange={(v) => onUpdateChorizo({ nino: v })}
            step={50}
            suffix="g"
          />
        </div>
      </div>

      {/* Cerveza */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-4 flex flex-col gap-3">
        <SectionTitle>🍺 Cerveza por persona (bebedores)</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <NumericInput
            label="Hombre"
            value={config.cerveza.hombre}
            onChange={(v) => onUpdateCerveza({ hombre: v })}
            step={0.5}
            suffix="L"
          />
          <NumericInput
            label="Mujer"
            value={config.cerveza.mujer}
            onChange={(v) => onUpdateCerveza({ mujer: v })}
            step={0.5}
            suffix="L"
          />
        </div>
        <p className="text-xs text-[hsl(var(--muted-fg))]">
          * Los niños no consumen alcohol
        </p>

        <Separator />

        <p className="text-sm font-medium">Envase de cerveza</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[hsl(var(--muted-fg))]">Tipo</Label>
            <Select
              value={config.beer.containerType}
              onValueChange={(v) =>
                onUpdateBeer({
                  containerType: v as ContainerType,
                  containerLabel: CONTAINER_TYPE_LABELS[v as ContainerType],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CONTAINER_TYPE_LABELS) as ContainerType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {CONTAINER_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[hsl(var(--muted-fg))]">Unidad</Label>
            <Select
              value={config.beer.unit}
              onValueChange={(v) => onUpdateBeer({ unit: v as CapacityUnit })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="litros">litros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-[hsl(var(--muted-fg))]">
            Capacidad ({config.beer.unit})
          </Label>
          <Input
            type="number"
            min={1}
            step={config.beer.unit === 'ml' ? 10 : 0.1}
            value={beerCapacityStr}
            onChange={(e) => setBeerCapacityStr(e.target.value)}
            onBlur={handleCapacityBlur}
            placeholder={config.beer.unit === 'ml' ? 'Ej: 473' : 'Ej: 1.5'}
          />
          <p className="text-xs text-[hsl(var(--muted-fg))]">
            Ej: 269 ml, 473 ml, 330 ml, 1 litro, 1.5 litros
          </p>
        </div>
      </div>

      {/* Reset button */}
      <Button variant="ghost" className="text-[hsl(var(--muted-fg))] text-sm" onClick={() => setResetOpen(true)}>
        <RotateCcw className="h-4 w-4" />
        Restaurar valores por defecto
      </Button>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-3 sticky bottom-20">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button onClick={onNext}>
          Ver lista
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Reset confirm dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar valores</DialogTitle>
            <DialogDescription>
              ¿Restaurar todos los valores de consumo a los valores por defecto?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onReset()
                setBeerCapacityStr('473')
                setResetOpen(false)
              }}
            >
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
