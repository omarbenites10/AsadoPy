import { createClient } from '@supabase/supabase-js'
import type { Contact, SavedAsado } from '@/types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseEnabled = !!(url && key)

export const supabase = isSupabaseEnabled
  ? createClient(url!, key!)
  : null

// ── Row types (Postgres snake_case) ──────────────────────────────────────────

export interface ContactRow {
  id: string
  user_id: string
  name: string
  sex: string
  drinks_alcohol: boolean
  alcohol_level: string
  phone: string
  is_favorite: boolean
  created_at: number
}

export interface AsadoRow {
  id: string
  user_id: string
  name: string
  status: string
  participants: unknown
  config: unknown
  created_at: number
  updated_at: number
  finished_at: number | null
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function toContactRow(c: Contact, userId: string): ContactRow {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    sex: c.sex,
    drinks_alcohol: c.drinksAlcohol,
    alcohol_level: c.alcoholLevel,
    phone: c.phone,
    is_favorite: c.isFavorite,
    created_at: c.createdAt,
  }
}

export function fromContactRow(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    sex: row.sex as Contact['sex'],
    drinksAlcohol: row.drinks_alcohol,
    alcoholLevel: row.alcohol_level as Contact['alcoholLevel'],
    phone: row.phone,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
  }
}

export function toAsadoRow(a: SavedAsado, userId: string): AsadoRow {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    status: a.status,
    participants: a.participants,
    config: a.config,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    finished_at: a.finishedAt ?? null,
  }
}

export function fromAsadoRow(row: AsadoRow): SavedAsado {
  return {
    id: row.id,
    name: row.name,
    status: row.status as SavedAsado['status'],
    participants: row.participants as SavedAsado['participants'],
    config: row.config as SavedAsado['config'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at ?? undefined,
  }
}
