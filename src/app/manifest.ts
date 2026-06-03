import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AsadoPy – Calculadora de Asado Paraguayo',
    short_name: 'AsadoPy',
    description: 'Calculá automáticamente todos los insumos para tu asado paraguayo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7ed',
    theme_color: '#f97316',
    orientation: 'portrait',
    scope: '/',
    lang: 'es',
    categories: ['food', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Calculadora',
        short_name: 'Calcular',
        description: 'Ir a la calculadora de asado',
        url: '/',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Contactos',
        short_name: 'Contactos',
        description: 'Ver agenda de contactos',
        url: '/contactos',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
