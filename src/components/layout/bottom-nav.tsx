'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Calculadora', icon: Flame },
  { href: '/contactos', label: 'Contactos', icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]/95 backdrop-blur pb-safe">
      <div className="flex h-16 items-center justify-around max-w-2xl mx-auto px-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors touch-feedback',
                active
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]'
              )}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all',
                  active && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
