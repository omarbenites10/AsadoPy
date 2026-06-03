'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StepParticipants } from '@/components/calculator/step-participants'
import { StepConfiguration } from '@/components/calculator/step-configuration'
import { StepShoppingList } from '@/components/calculator/step-shopping-list'
import { useParticipants } from '@/hooks/useParticipants'
import { useConsumptionConfig } from '@/hooks/useConsumptionConfig'
import { useCalculations } from '@/hooks/useCalculations'
import type { CalculatorStep } from '@/types'

const STEPS: { id: CalculatorStep; label: string }[] = [
  { id: 'participantes', label: 'Participantes' },
  { id: 'configuracion', label: 'Configuración' },
  { id: 'lista', label: 'Lista' },
]

const stepIndex: Record<CalculatorStep, number> = {
  participantes: 0,
  configuracion: 1,
  lista: 2,
}

export default function CalculadoraPage() {
  const [step, setStep] = useState<CalculatorStep>('participantes')
  const {
    participants,
    addFromContact,
    addManual,
    updateParticipant,
    removeParticipant,
    clearParticipants,
    isContactSelected,
  } = useParticipants()
  const {
    config,
    updateCarne,
    updateChorizo,
    updateCerveza,
    updateBeer,
    resetToDefaults,
  } = useConsumptionConfig()
  const shoppingList = useCalculations(participants, config)

  const currentIndex = stepIndex[step]

  function handleReset() {
    clearParticipants()
    setStep('participantes')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Step indicator */}
      <div className="flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={currentIndex}>
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-1">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < currentIndex
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : i === currentIndex
                  ? 'bg-[hsl(var(--primary))] text-white ring-4 ring-orange-200 dark:ring-orange-900/40'
                  : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-fg))]'
              }`}
            >
              {i < currentIndex ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs truncate transition-colors ${i === currentIndex ? 'font-semibold text-[hsl(var(--fg))]' : 'text-[hsl(var(--muted-fg))]'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${i < currentIndex ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'participantes' && (
          <motion.div
            key="participantes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepParticipants
              participants={participants}
              onAddFromContact={addFromContact}
              onAddManual={addManual}
              onUpdate={updateParticipant}
              onRemove={removeParticipant}
              isContactSelected={isContactSelected}
              onNext={() => setStep('configuracion')}
            />
          </motion.div>
        )}

        {step === 'configuracion' && (
          <motion.div
            key="configuracion"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepConfiguration
              config={config}
              onUpdateCarne={updateCarne}
              onUpdateChorizo={updateChorizo}
              onUpdateCerveza={updateCerveza}
              onUpdateBeer={updateBeer}
              onReset={resetToDefaults}
              onBack={() => setStep('participantes')}
              onNext={() => setStep('lista')}
            />
          </motion.div>
        )}

        {step === 'lista' && (
          <motion.div
            key="lista"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepShoppingList
              list={shoppingList}
              onBack={() => setStep('configuracion')}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
