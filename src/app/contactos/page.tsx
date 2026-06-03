import type { Metadata } from 'next'
import { ContactList } from '@/components/contacts/contact-list'

export const metadata: Metadata = {
  title: 'Contactos – AsadoPy',
  description: 'Gestioná tu agenda de contactos para invitar rápidamente a tus asados.',
}

export default function ContactosPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Contactos</h1>
        <p className="text-sm text-[hsl(var(--muted-fg))] mt-1">
          Tu agenda de personas frecuentes en los asados
        </p>
      </div>
      <ContactList />
    </div>
  )
}
