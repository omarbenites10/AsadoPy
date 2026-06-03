import { Flame } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

interface AppHeaderProps {
  title?: string
}

export function AppHeader({ title = 'AsadoPy' }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--bg))]/80">
      <div className="flex h-14 items-center justify-between px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">{title}</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
