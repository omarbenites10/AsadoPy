'use client'

import { useCallback, useMemo, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage'
import { supabase, toContactRow, fromContactRow } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
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
  const { user } = useAuthStore()
  const sorted = useMemo(() => sortContacts(contacts), [contacts])

  // ── Initial sync: on login, push local → Supabase then pull all ──────────────
  useEffect(() => {
    if (!user || !supabase) return
    const sb = supabase

    const sync = async () => {
      try {
        const localContacts = contacts
        if (localContacts.length > 0) {
          await sb
            .from('contacts')
            .upsert(localContacts.map((c) => toContactRow(c, user.id)), {
              onConflict: 'id',
              ignoreDuplicates: true,
            })
        }
        const { data } = await sb
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
        if (data) {
          setContacts(prev => {
            const selfId = prev.find(c => c.isSelf)?.id
            return data.map(row => {
              const fromDb = fromContactRow(row)
              return selfId === fromDb.id ? { ...fromDb, isSelf: true } : fromDb
            })
          })
        }
      } catch (e) {
        console.error('Contact sync error:', e)
      }
    }

    sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ── Real-time subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !supabase) return
    const sb = supabase

    const channel = sb
      .channel(`contacts-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setContacts((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id))
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = fromContactRow(payload.new as Parameters<typeof fromContactRow>[0])
            setContacts((prev) => {
              const existing = prev.find((c) => c.id === updated.id)
              const withSelf = existing?.isSelf ? { ...updated, isSelf: true } : updated
              const exists = prev.some((c) => c.id === updated.id)
              return exists ? prev.map((c) => (c.id === updated.id ? withSelf : c)) : [...prev, withSelf]
            })
          }
        }
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [user?.id, setContacts])

  // ── Write helpers ─────────────────────────────────────────────────────────────

  const addContact = useCallback(
    (data: Omit<Contact, 'id' | 'createdAt'>) => {
      const contact: Contact = {
        ...data,
        isFavorite: data.isFavorite ?? false,
        id: generateId(),
        createdAt: Date.now(),
      }
      setContacts((prev) => {
        const base = contact.isSelf ? prev.map(c => ({ ...c, isSelf: false })) : prev
        return [...base, contact]
      })
      if (user && supabase) {
        const sb = supabase
        sb.from('contacts').insert(toContactRow(contact, user.id)).then(({ error }) => { if (error) console.error(error) })
      }
      return contact
    },
    [setContacts, user]
  )

  const updateContact = useCallback(
    (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>) => {
      setContacts((prev) => {
        if (data.isSelf) {
          return prev.map(c => c.id === id ? { ...c, ...data } : { ...c, isSelf: false })
        }
        return prev.map(c => c.id === id ? { ...c, ...data } : c)
      })
      if (user && supabase) {
        const sb = supabase
        sb.from('contacts').update(data).eq('id', id).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
      }
    },
    [setContacts, user]
  )

  const deleteContact = useCallback(
    (id: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== id))
      if (user && supabase) {
        const sb = supabase
        sb.from('contacts').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
      }
    },
    [setContacts, user]
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      let newVal = false
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          newVal = !c.isFavorite
          return { ...c, isFavorite: newVal }
        })
      )
      if (user && supabase) {
        const sb = supabase
        sb.from('contacts')
          .update({ is_favorite: newVal })
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => { if (error) console.error(error) })
      }
    },
    [setContacts, user]
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
