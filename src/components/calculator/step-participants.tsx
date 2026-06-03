'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, UserPlus, Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContactCard } from '@/components/contacts/contact-card'
import { ParticipantCard } from './participant-card'
import { useContacts } from '@/hooks/useContacts'
import type { Contact, Participant, Sex, AlcoholLevel } from '@/types'
import { SEX_LABELS, ALCOHOL_LEVEL_LABELS, ALCOHOL_LEVEL_DESCRIPTIONS } from '@/types'

const ALCOHOL_LEVELS: AlcoholLevel[] = ['tranquilo', 'normal', 'fuerte']
const LEVEL_EMOJI: Record<AlcoholLevel, string> = {
  tranquilo: '🍺',
  normal: '🍺🍺',
  fuerte: '🍺🍺🍺',
}

interface StepParticipantsProps {
  participants: Participant[]
  onAddFromContact: (contact: Contact) => void
  onAddManual: (data: Omit<Participant, 'id'>) => void
  onUpdate: (id: string, data: Partial<Omit<Participant, 'id'>>) => void
  onRemove: (id: string) => void
  isContactSelected: (contactId: string) => boolean
  onNext: () => void
}

export function StepParticipants({
  participants,
  onAddFromContact,
  onAddManual,
  onUpdate,
  onRemove,
  isContactSelected,
  onNext,
}: StepParticipantsProps) {
  const { contacts } = useContacts()
  const [contactsOpen, setContactsOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  const [manualName, setManualName] = useState('')
  const [manualSex, setManualSex] = useState<Sex>('hombre')
  const [manualDrinks, setManualDrinks] = useState(true)
  const [manualLevel, setManualLevel] = useState<AlcoholLevel>('normal')
  const [manualError, setManualError] = useState('')

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  )

  function handleAddManual() {
    if (!manualName.trim()) { setManualError('El nombre es requerido'); return }
    const drinks = manualSex === 'nino' ? false : manualDrinks
    onAddManual({
      name: manualName.trim(),
      sex: manualSex,
      drinksAlcohol: drinks,
      alcoholLevel: drinks ? manualLevel : 'normal',
    })
    resetManualForm()
    setManualOpen(false)
  }

  function handleManualSexChange(v: Sex) {
    setManualSex(v)
    if (v === 'nino') setManualDrinks(false)
  }

  function resetManualForm() {
    setManualName(''); setManualSex('hombre'); setManualDrinks(true)
    setManualLevel('normal'); setManualError('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex-col h-auto py-4 gap-2 border-dashed"
          onClick={() => setContactsOpen(true)}
          disabled={contacts.length === 0}
        >
          <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
          <span className="text-xs">Desde agenda</span>
          {contacts.length === 0 && (
            <span className="text-xs text-[hsl(var(--muted-fg))]">(sin contactos)</span>
          )}
        </Button>
        <Button
          variant="outline"
          className="flex-col h-auto py-4 gap-2 border-dashed"
          onClick={() => setManualOpen(true)}
        >
          <UserPlus className="h-5 w-5 text-[hsl(var(--primary))]" />
          <span className="text-xs">Agregar manual</span>
        </Button>
      </div>

      {participants.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-10 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))]">
            <Users className="h-7 w-7 text-[hsl(var(--muted-fg))]" />
          </div>
          <p className="font-semibold">Sin participantes</p>
          <p className="text-sm text-[hsl(var(--muted-fg))]">
            Agrega personas al asado para calcular los insumos
          </p>
        </motion.div>
      ) : (
        <>
          <span className="text-sm font-semibold text-[hsl(var(--muted-fg))]">
            {participants.length} participante{participants.length !== 1 ? 's' : ''}
          </span>
          <AnimatePresence mode="popLayout">
            {participants.map((p) => (
              <ParticipantCard key={p.id} participant={p} onUpdate={onUpdate} onRemove={onRemove} />
            ))}
          </AnimatePresence>
        </>
      )}

      {participants.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-20 pt-2">
          <Button className="w-full h-12 text-base" onClick={onNext}>
            Configurar consumos <ChevronRight className="h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {/* Select from contacts dialog */}
      <Dialog open={contactsOpen} onOpenChange={setContactsOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Seleccionar contactos</DialogTitle></DialogHeader>
          <Input placeholder="Buscar..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 mt-2">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-sm text-[hsl(var(--muted-fg))] py-4">No se encontraron contactos</p>
            ) : (
              filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  selectable
                  selected={isContactSelected(contact.id)}
                  onSelect={(c) => { if (!isContactSelected(c.id)) onAddFromContact(c) }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))
            )}
          </div>
          <Button onClick={() => setContactsOpen(false)} className="mt-2">Listo</Button>
        </DialogContent>
      </Dialog>

      {/* Manual participant dialog */}
      <Dialog open={manualOpen} onOpenChange={(o) => { setManualOpen(o); if (!o) resetManualForm() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar participante</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Pedro"
                value={manualName}
                onChange={(e) => { setManualName(e.target.value); if (manualError) setManualError('') }}
                aria-invalid={!!manualError}
              />
              {manualError && <p className="text-xs text-[hsl(var(--destructive))]">{manualError}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sexo</Label>
              <Select value={manualSex} onValueChange={(v) => handleManualSexChange(v as Sex)}>
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
                <Switch checked={manualDrinks} onCheckedChange={setManualDrinks} disabled={manualSex === 'nino'} />
              </div>
              {manualDrinks && manualSex !== 'nino' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <Label className="text-xs text-[hsl(var(--muted-fg))]">Nivel de cerveza</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ALCOHOL_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setManualLevel(level)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition-all ${
                          manualLevel === level
                            ? 'border-[hsl(var(--primary))] bg-orange-50 dark:bg-orange-950/30'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--card-bg))]'
                        }`}
                      >
                        <span className="text-sm">{LEVEL_EMOJI[level]}</span>
                        <span className="text-xs font-semibold">{ALCOHOL_LEVEL_LABELS[level]}</span>
                        <span className="text-xs text-[hsl(var(--muted-fg))]">{ALCOHOL_LEVEL_DESCRIPTIONS[level]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setManualOpen(false); resetManualForm() }}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAddManual}>
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
