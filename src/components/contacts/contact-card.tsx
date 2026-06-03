'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Phone, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ContactForm } from './contact-form'
import type { Contact } from '@/types'
import { SEX_LABELS, ALCOHOL_LEVEL_LABELS } from '@/types'

const SEX_COLORS = {
  hombre: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  mujer: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  nino: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const LEVEL_EMOJI = { tranquilo: '🍺', normal: '🍺🍺', fuerte: '🍺🍺🍺' }

interface ContactCardProps {
  contact: Contact
  onEdit: (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  onToggleFavorite?: (id: string) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (contact: Contact) => void
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  onToggleFavorite,
  selectable,
  selected,
  onSelect,
}: ContactCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const initials = contact.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className={`flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card-bg))] p-4 transition-all ${
          selectable ? 'cursor-pointer hover:border-[hsl(var(--primary))] active:scale-[0.98]' : ''
        } ${selected ? 'border-[hsl(var(--primary))] bg-orange-50 dark:bg-orange-950/30' : ''}`}
        onClick={selectable && onSelect ? () => onSelect(contact) : undefined}
        role={selectable ? 'button' : undefined}
        aria-pressed={selectable ? selected : undefined}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 font-bold text-white text-sm">
          {initials || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {contact.isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
            )}
            <span className="font-semibold text-sm truncate">{contact.name}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SEX_COLORS[contact.sex]}`}>
              {SEX_LABELS[contact.sex]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {contact.phone && (
              <span className="text-xs text-[hsl(var(--muted-fg))] flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact.phone}
              </span>
            )}
            {contact.sex !== 'nino' && (
              <span className="text-xs text-[hsl(var(--muted-fg))]">
                {contact.drinksAlcohol
                  ? `${LEVEL_EMOJI[contact.alcoholLevel ?? 'normal']} ${ALCOHOL_LEVEL_LABELS[contact.alcoholLevel ?? 'normal']}`
                  : '🚫 No toma'}
              </span>
            )}
          </div>
        </div>

        {!selectable && (
          <div className="flex items-center gap-1 shrink-0">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={contact.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(contact.id) }}
                className={contact.isFavorite ? 'text-amber-400' : 'text-[hsl(var(--muted-fg))]'}
              >
                <Star className={`h-4 w-4 ${contact.isFavorite ? 'fill-amber-400' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${contact.name}`}
              onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[hsl(var(--destructive))]"
              aria-label={`Eliminar ${contact.name}`}
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {selectable && selected && (
          <div className="h-5 w-5 shrink-0 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <ContactForm
            initialData={contact}
            onSubmit={(data) => { onEdit(contact.id, data); setEditOpen(false) }}
            onCancel={() => setEditOpen(false)}
            submitLabel="Actualizar"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar contacto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{contact.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { onDelete(contact.id); setDeleteOpen(false) }}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
