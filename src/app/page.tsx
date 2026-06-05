'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Flame, ChevronLeft } from 'lucide-react'
import { StepParticipants } from '@/components/calculator/step-participants'
import { StepConfiguration } from '@/components/calculator/step-configuration'
import { StepShoppingList } from '@/components/calculator/step-shopping-list'
import { AsadoCard } from '@/components/asados/asado-card'
import { SaveAsadoDialog } from '@/components/asados/save-asado-dialog'
import { Button } from '@/components/ui/button'
import { useParticipants } from '@/hooks/useParticipants'
import { useConsumptionConfig } from '@/hooks/useConsumptionConfig'
import { useCalculations } from '@/hooks/useCalculations'
import { useAsados } from '@/hooks/useAsados'
import { toast } from '@/hooks/useToast'
import type { CalculatorStep, SavedAsado } from '@/types'

type HomeView = 'list' | 'calculator'

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

export default function HomePage() {
  const [view, setView] = useState<HomeView>('list')
  const [step, setStep] = useState<CalculatorStep>('participantes')
  const [currentAsadoId, setCurrentAsadoId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const {
    participants, addFromContact, addManual, updateParticipant,
    removeParticipant, clearParticipants, loadParticipants, isContactSelected,
  } = useParticipants()
  const { config, updateCarne, updateChorizo, updateBeer, resetToDefaults, loadConfig } =
    useConsumptionConfig()
  const shoppingList = useCalculations(participants, config)
  const { asados, saveNew, update, finish, duplicate, remove } = useAsados()

  const currentAsado = currentAsadoId ? asados.find((a) => a.id === currentAsadoId) ?? null : null
  const isSaved = currentAsadoId !== null
  const isFinished = currentAsado?.status === 'finalizado'

  function startNewAsado() {
    clearParticipants()
    setCurrentAsadoId(null)
    setStep('participantes')
    setView('calculator')
  }

  function openAsado(asado: SavedAsado) {
    loadParticipants(asado.participants)
    loadConfig(asado.config)
    setCurrentAsadoId(asado.id)
    setStep(asado.status === 'finalizado' ? 'lista' : 'participantes')
    setView('calculator')
  }

  function handleSaveAsado(name: string) {
    if (currentAsadoId) {
      update(currentAsadoId, participants, config, name)
      toast({ title: 'Asado actualizado', variant: 'default' })
    } else {
      saveNew(name, participants, config).then((saved) => {
        setCurrentAsadoId(saved.id)
        toast({ title: 'Asado guardado', variant: 'default' })
      })
    }
  }

  function handleFinishAsado() {
    if (!currentAsadoId) return
    update(currentAsadoId, participants, config)
    finish(currentAsadoId)
    toast({ title: '¡Asado finalizado!', variant: 'default' })
  }

  function handleDuplicate(id: string) {
    duplicate(id).then((copy) => {
      if (copy) {
        openAsado(copy)
        toast({ title: 'Asado duplicado', variant: 'default' })
      }
    })
  }

  function handleReset() {
    clearParticipants()
    setCurrentAsadoId(null)
    setStep('participantes')
    setView('list')
  }

  const handleStepChange = useCallback(
    (newStep: CalculatorStep) => {
      if (currentAsadoId) update(currentAsadoId, participants, config)
      setStep(newStep)
    },
    [currentAsadoId, participants, config, update]
  )

  const currentIndex = stepIndex[step]
  const activeAsados = asados.filter((a) => a.status === 'activo')
  const finishedAsados = asados.filter((a) => a.status === 'finalizado')

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mis asados</h1>
            <p className="text-sm text-[hsl(var(--muted-fg))] mt-0.5">
              {asados.length === 0
                ? 'Comenzá tu primer asado'
                : `${activeAsados.length} activo${activeAsados.length !== 1 ? 's' : ''} · ${finishedAsados.length} finalizado${finishedAsados.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={startNewAsado} size="sm">
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        </div>

        {asados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/40 dark:to-red-950/40">
              <Flame className="h-10 w-10 text-orange-400" />
            </div>
            <div>
              <p className="font-bold text-lg">Sin asados guardados</p>
              <p className="text-sm text-[hsl(var(--muted-fg))] mt-1 max-w-xs">
                Creá tu primer asado, seleccioná participantes y calculá todo lo que necesitás comprar
              </p>
            </div>
            <Button onClick={startNewAsado} size="lg">
              <Flame className="h-5 w-5" /> Comenzar asado
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activeAsados.map((asado) => (
              <AsadoCard key={asado.id} asado={asado} onOpen={openAsado} onDuplicate={handleDuplicate} onDelete={remove} />
            ))}

            {finishedAsados.length > 0 && (
              <motion.div key="finished-header" layout className="flex items-center gap-2 mt-2">
                <div className="h-px flex-1 bg-[hsl(var(--border))]" />
                <span className="text-xs text-[hsl(var(--muted-fg))] font-medium">Finalizados</span>
                <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              </motion.div>
            )}
            {finishedAsados.map((asado) => (
              <AsadoCard key={asado.id} asado={asado} onOpen={openAsado} onDuplicate={handleDuplicate} onDelete={remove} />
            ))}
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => setView('list')} aria-label="Volver a mis asados">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold truncate flex-1">
          {currentAsado?.name ?? 'Nuevo asado'}
        </span>
        {isFinished && (
          <span className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--muted-fg))] px-2 py-0.5 rounded-full">
            Finalizado
          </span>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={currentIndex}>
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-1">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              i < currentIndex ? 'bg-[hsl(var(--primary))] text-white'
              : i === currentIndex ? 'bg-[hsl(var(--primary))] text-white ring-4 ring-orange-200 dark:ring-orange-900/40'
              : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-fg))]'
            }`}>
              {i < currentIndex ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
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
        {step === 'participantes' && !isFinished && (
          <motion.div key="participantes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <StepParticipants
              participants={participants}
              onAddFromContact={addFromContact}
              onAddManual={addManual}
              onUpdate={updateParticipant}
              onRemove={removeParticipant}
              isContactSelected={isContactSelected}
              onNext={() => handleStepChange('configuracion')}
            />
          </motion.div>
        )}

        {step === 'configuracion' && !isFinished && (
          <motion.div key="configuracion" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <StepConfiguration
              config={config}
              onUpdateCarne={updateCarne}
              onUpdateChorizo={updateChorizo}
              onUpdateBeer={updateBeer}
              onReset={resetToDefaults}
              onBack={() => handleStepChange('participantes')}
              onNext={() => handleStepChange('lista')}
            />
          </motion.div>
        )}

        {step === 'lista' && (
          <motion.div key="lista" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <StepShoppingList
              list={shoppingList}
              participants={participants}
              config={config}
              asadoName={currentAsado?.name}
              asadoId={currentAsadoId ?? undefined}
              onBack={() => !isFinished && handleStepChange('configuracion')}
              onReset={handleReset}
              onSave={() => setSaveDialogOpen(true)}
              onFinish={isSaved && !isFinished ? handleFinishAsado : undefined}
              isSaved={isSaved}
              isFinished={isFinished}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SaveAsadoDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveAsado}
        initialName={currentAsado?.name}
        mode={isSaved ? 'update' : 'save'}
      />
    </div>
  )
}
