'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage'
import type { Contact } from '@/types'

export function useContacts() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(STORAGE_KEYS.CONTACTS, [])

  const addContact = useCallback(
    (data: Omit<Contact, 'id' | 'createdAt'>) => {
      const contact: Contact = {
        ...data,
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

  const searchContacts = useCallback(
    (query: string): Contact[] => {
      if (!query.trim()) return contacts
      const q = query.toLowerCase()
      return contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
    },
    [contacts]
  )

  return {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    searchContacts,
  }
}
