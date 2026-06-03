'use client'

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage'
import type { Contact } from '@/types'

function sortContacts(list: Contact[]): Contact[] {
  return [...list].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  })
}

export function useContacts() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(STORAGE_KEYS.CONTACTS, [])

  const sorted = useMemo(() => sortContacts(contacts), [contacts])

  const addContact = useCallback(
    (data: Omit<Contact, 'id' | 'createdAt'>) => {
      const contact: Contact = {
        ...data,
        isFavorite: data.isFavorite ?? false,
        id: generateId(),
        createdAt: Date.now(),
      }
      setContacts((prev) => [...prev, contact])
      return contact
    },
    [setContacts]
  )

  const updateContact = useCallback(
    (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      )
    },
    [setContacts]
  )

  const deleteContact = useCallback(
    (id: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== id))
    },
    [setContacts]
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
      )
    },
    [setContacts]
  )

  const searchContacts = useCallback(
    (query: string): Contact[] => {
      const base = query.trim()
        ? contacts.filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.phone.includes(query)
          )
        : contacts
      return sortContacts(base)
    },
    [contacts]
  )

  return {
    contacts: sorted,
    addContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    searchContacts,
  }
}
