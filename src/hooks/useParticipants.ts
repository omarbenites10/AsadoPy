'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage'
import type { Participant, Contact } from '@/types'

export function useParticipants() {
  const [participants, setParticipants] = useLocalStorage<Participant[]>(
    STORAGE_KEYS.PARTICIPANTS,
    []
  )

  const addFromContact = useCallback(
    (contact: Contact) => {
      const alreadyAdded = participants.some((p) => p.contactId === contact.id)
      if (alreadyAdded) return null

      const drinksAlcohol = contact.sex === 'nino' ? false : contact.drinksAlcohol
      const participant: Participant = {
        id: generateId(),
        contactId: contact.id,
        name: contact.name,
        sex: contact.sex,
        drinksAlcohol,
        alcoholLevel: contact.alcoholLevel ?? 'normal',
      }
      setParticipants((prev) => [...prev, participant])
      return participant
    },
    [participants, setParticipants]
  )

  const addManual = useCallback(
    (data: Omit<Participant, 'id'>) => {
      const drinksAlcohol = data.sex === 'nino' ? false : data.drinksAlcohol
      const participant: Participant = {
        ...data,
        id: generateId(),
        drinksAlcohol,
        alcoholLevel: drinksAlcohol ? (data.alcoholLevel ?? 'normal') : 'normal',
      }
      setParticipants((prev) => [...prev, participant])
      return participant
    },
    [setParticipants]
  )

  const updateParticipant = useCallback(
    (id: string, data: Partial<Omit<Participant, 'id'>>) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const updated = { ...p, ...data }
          if (updated.sex === 'nino') {
            updated.drinksAlcohol = false
          }
          return updated
        })
      )
    },
    [setParticipants]
  )

  const removeParticipant = useCallback(
    (id: string) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id))
    },
    [setParticipants]
  )

  const clearParticipants = useCallback(() => {
    setParticipants([])
  }, [setParticipants])

  const loadParticipants = useCallback(
    (list: Participant[]) => {
      setParticipants(list)
    },
    [setParticipants]
  )

  const isContactSelected = useCallback(
    (contactId: string) => participants.some((p) => p.contactId === contactId),
    [participants]
  )

  return {
    participants,
    addFromContact,
    addManual,
    updateParticipant,
    removeParticipant,
    clearParticipants,
    loadParticipants,
    isContactSelected,
  }
}
