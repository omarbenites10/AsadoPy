'use client'

import { useState } from 'react'
import { Cloud, CloudOff, CloudCheck, Loader2, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AuthModal } from '@/components/auth/auth-modal'
import { useAuth } from '@/hooks/useAuth'

export function SyncButton() {
  const { user, loading, syncing, signOut, isSupabaseEnabled } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)

  if (!isSupabaseEnabled) return null
  if (loading) return null

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sincronizar con la nube"
          title="Iniciar sesión para sincronizar"
          onClick={() => setAuthOpen(true)}
          className="relative"
        >
          <CloudOff className="h-5 w-5 text-[hsl(var(--muted-fg))]" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-[hsl(var(--bg))]" />
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={syncing ? 'Sincronizando…' : `Sincronizado — ${user.email}`}
        title={syncing ? 'Sincronizando…' : `Sesión: ${user.email}`}
        onClick={() => setSignOutOpen(true)}
        className="relative"
      >
        {syncing ? (
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />
        ) : (
          <CloudCheck className="h-5 w-5 text-[hsl(var(--primary))]" />
        )}
      </Button>

      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[hsl(var(--primary))]" />
              Cuenta sincronizada
            </DialogTitle>
            <DialogDescription>
              Sesión activa como <strong>{user.email}</strong>.<br />
              Tus datos se sincronizan automáticamente en todos tus dispositivos.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-[hsl(var(--secondary))] p-3 text-sm text-[hsl(var(--muted-fg))]">
            <CloudCheck className="inline h-4 w-4 text-[hsl(var(--primary))] mr-1.5" />
            Contactos y asados sincronizados en tiempo real
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOutOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => { await signOut(); setSignOutOpen(false) }}
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
