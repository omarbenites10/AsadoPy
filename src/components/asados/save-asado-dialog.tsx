'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

function suggestName(): string {
  const now = new Date()
  const day = now.toLocaleDateString('es-PY', { weekday: 'long' })
  const date = now.toLocaleDateString('es-PY', { day: 'numeric', month: 'long' })
  return `Asado del ${day} ${date}`
}

interface SaveAsadoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  initialName?: string
  mode?: 'save' | 'update'
}

export function SaveAsadoDialog({
  open,
  onOpenChange,
  onSave,
  initialName,
  mode = 'save',
}: SaveAsadoDialogProps) {
  const [name, setName] = useState(initialName ?? suggestName())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setName(initialName ?? suggestName())
  }, [open, initialName])

  function handleSave() {
    if (!name.trim()) { setError('El nombre es requerido'); return }
    onSave(name.trim())
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'update' ? 'Actualizar asado' : 'Guardar asado'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'update'
              ? 'El asado se actualizará con los participantes e insumos actuales.'
              : 'Dale un nombre a este asado para poder retomarlo después.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre del asado</Label>
            <Input
              placeholder="Ej: Asado del sábado"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              aria-invalid={!!error}
              autoFocus
            />
            {error && <p className="text-xs text-[hsl(var(--destructive))]">{error}</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {mode === 'update' ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
