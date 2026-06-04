'use client'

import { useAuthInit } from '@/hooks/useAuth'

/** Mounts auth listener — renders nothing. */
export function AuthInit() {
  useAuthInit()
  return null
}
