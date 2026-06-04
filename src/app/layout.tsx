import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AsadoPy – Calculadora de Asado Paraguayo',
  description:
    'Calculá automáticamente todos los insumos para tu asado paraguayo: carne, chorizo, cerveza, mandioca, pan, carbón y más.',
  keywords: ['asado', 'paraguay', 'calculadora', 'insumos', 'asado paraguayo', 'compras'],
  authors: [{ name: 'AsadoPy' }],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AsadoPy',
  },
  openGraph: {
    title: 'AsadoPy – Calculadora de Asado Paraguayo',
    description: 'Calculá todos los insumos para tu asado paraguayo en segundos.',
    type: 'website',
    locale: 'es_PY',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#1c0f07' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={geistSans.variable} suppressHydrationWarning>
      <head />
      <body className="min-h-dvh flex flex-col bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppHeader />
          <main className="flex-1 pb-24 pt-4 px-4 max-w-2xl mx-auto w-full">
            {children}
          </main>
          <BottomNav />
          <Toaster />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </body>
    </html>
  )
}
