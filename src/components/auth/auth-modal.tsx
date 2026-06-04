'use client'

import { useState } from 'react'
import { Loader2, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'signin' | 'signup' | 'check-email'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setEmail('')
    setPassword('')
    setError('')
    setLoading(false)
    setMode('signin')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('Completá todos los campos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    setError('')
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
        onOpenChange(false)
        reset()
      } else {
        await signUp(email.trim(), password)
        setMode('check-email')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos')
      else if (msg.includes('User already registered')) setError('Ya existe una cuenta con ese email')
      else if (msg.includes('Email not confirmed')) setError('Confirmá tu email antes de iniciar sesión')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'check-email') {
    return (
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisá tu email</DialogTitle>
            <DialogDescription>
              Te enviamos un enlace de confirmación a <strong>{email}</strong>.
              Hacé clic en el enlace para activar tu cuenta y luego iniciá sesión.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setMode('signin')} className="mt-2">
            Ir a iniciar sesión
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'signin' ? (
              <><LogIn className="h-5 w-5 text-[hsl(var(--primary))]" /> Iniciar sesión</>
            ) : (
              <><UserPlus className="h-5 w-5 text-[hsl(var(--primary))]" /> Crear cuenta</>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin'
              ? 'Sincronizá tus asados y contactos en todos tus dispositivos.'
              : 'Creá una cuenta gratuita para sincronizar tus datos en la nube.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-fg))]" />
              <Input
                id="auth-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                className="pl-9"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-fg))]" />
              <Input
                id="auth-password"
                type="password"
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                className="pl-9"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[hsl(var(--destructive))] bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="h-11">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
            ) : mode === 'signin' ? (
              <><LogIn className="h-4 w-4" /> Iniciar sesión</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Crear cuenta</>
            )}
          </Button>

          <div className="text-center text-sm text-[hsl(var(--muted-fg))]">
            {mode === 'signin' ? (
              <>
                ¿No tenés cuenta?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError('') }} className="text-[hsl(var(--primary))] font-medium hover:underline">
                  Registrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError('') }} className="text-[hsl(var(--primary))] font-medium hover:underline">
                  Iniciá sesión
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
