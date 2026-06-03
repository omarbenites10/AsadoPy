'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Phone, Beer, BeerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { SEX_LABELS } from '@/types'

const SEX_COLORS = {
  hombre: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  mujer: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  nino: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

interface ContactCardProps {
  contact: Contact
  onEdit: (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (contact: Contact) => void
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
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
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 font-bold text-white text-sm">
          {initials || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{contact.name}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEX_COLORS[contact.sex]}`}>
              {SEX_LABELS[contact.sex]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {contact.phone && (
              <span className="text-xs text-[hsl(var(--muted-fg))] flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact.phone}
              </span>
            )}
            <span className="text-xs text-[hsl(var(--muted-fg))] flex items-center gap-1">
              {contact.drinksAlcohol ? (
                <>
                  <Beer className="h-3 w-3 text-amber-500" />
                  <span>Toma alcohol</span>
                </>
              ) : (
                <>
                  <BeerOff className="h-3 w-3" />
                  <span>No toma</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!selectable && (
          <div className="flex items-center gap-1 shrink-0">
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
              aria-label={`Eliminar ${contact.name}`}
              className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <ContactForm
            initialData={contact}
            onSubmit={(data) => {
              onEdit(contact.id, data)
              setEditOpen(false)
            }}
            onCancel={() => setEditOpen(false)}
            submitLabel="Actualizar"
          />
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar contacto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{contact.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(contact.id)
                setDeleteOpen(false)
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
