'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContactCard } from './contact-card'
import { ContactForm } from './contact-form'
import { useContacts } from '@/hooks/useContacts'
import { toast } from '@/hooks/useToast'

export function ContactList() {
  const { contacts, addContact, updateContact, deleteContact, toggleFavorite, searchContacts } = useContacts()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = searchContacts(search)

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-fg))]" />
          <Input
            placeholder="Buscar contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar contactos"
          />
        </div>
        <Button
          size="icon"
          aria-label="Agregar contacto"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* List */}
      {contacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 py-12 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))]">
            <Users className="h-8 w-8 text-[hsl(var(--muted-fg))]" />
          </div>
          <div>
            <p className="font-semibold text-[hsl(var(--fg))]">Sin contactos aún</p>
            <p className="text-sm text-[hsl(var(--muted-fg))] mt-1">
              Agrega contactos para seleccionarlos rápidamente en tus asados
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Agregar primer contacto
          </Button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <p className="text-[hsl(var(--muted-fg))]">
            No se encontraron contactos para &quot;{search}&quot;
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={(id, data) => {
                updateContact(id, data)
                toast({ title: 'Contacto actualizado', variant: 'default' })
              }}
              onDelete={(id) => {
                deleteContact(id)
                toast({ title: 'Contacto eliminado', variant: 'default' })
              }}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Add contact dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
          </DialogHeader>
          <ContactForm
            onSubmit={(data) => {
              addContact(data)
              setAddOpen(false)
              toast({ title: 'Contacto agregado', variant: 'default' })
            }}
            onCancel={() => setAddOpen(false)}
            submitLabel="Agregar"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
