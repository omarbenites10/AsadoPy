const STORAGE_KEYS = {
  CONTACTS: 'asadopy_contacts',
  PARTICIPANTS: 'asadopy_participants',
  CONSUMPTION_CONFIG: 'asadopy_consumption_config',
  ASADOS: 'asadopy_asados',
  CURRENT_ASADO_ID: 'asadopy_current_asado_id',
} as const

export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const item = window.localStorage.getItem(key)
    if (item === null) return fallback
    return JSON.parse(item) as T
  } catch {
    return fallback
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // fail silently
  }
}

export { STORAGE_KEYS }
