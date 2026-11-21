import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ChartDataEditor from '../components/ChartDataEditor'
import ErrorBox from '../components/ErrorBox'
import Loading from '../components/Loading'
import TaskForm from '../components/TaskForm'
import { Card, PageTitle } from '../components/ui'
import { EVALUATION_STEPS, EXTRACT_STEPS } from '../configs/app'
import { clearDraft, getDraft, setDraft, type Draft } from '../lib/drafts'
import { evaluateAndSave, readChart } from '../lib/flow'
import { asGeminiError, type GeminiError } from '../lib/gemini/errors'
import type { ChartData } from '../lib/schema'
import { useSettings } from '../lib/storage/settings'
import { useRunner } from '../lib/useRunner'

type Stage = 'form' | 'extracting' | 'review' | 'evaluating'

const STEP_LABELS = ['Your answer', 'Check chart data', 'Results']

function Stepper({ stage }: { stage: Stage }) {
  const active = stage === 'form' || stage === 'extracting' ? 0 : 1
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm" aria-label="Progress">
      {STEP_LABELS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              i < active ? 'bg-mint-400 text-white' : i === active ? 'bg-accent-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {i < active ? '✓' : i + 1}
          </span>
          <span className={i === active ? 'font-semibold text-accent-800' : 'text-slate-500'}>{label}</span>
          {i < STEP_LABELS.length - 1 && <span className="mx-1 h-px w-6 bg-slate-300 sm:w-10" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  )
}

export default function Task1() {
  const { apiKey } = useSettings()
  const navigate = useNavigate()
  const runner = useRunner()
  const [draft, setDraftState] = useState<Draft>(() => getDraft('task1'))
  const [stage, setStage] = useState<Stage>('form')
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [error, setError] = useState<GeminiError | null>(null)
  const [lastAction, setLastAction] = useState<'extract' | 'evaluate'>('extract')

  if (!apiKey) return <Navigate to="/settings" replace state={{ next: '/task1' }} />

  function update(patch: Partial<Draft>) {
    setDraft('task1', patch)
    setDraftState((d) => ({ ...d, ...patch }))
  }

  async function extract() {
    if (!draft.image) return
    setError(null)
    setLastAction('extract')
    setStage('extracting')
    const signal = runner.start()
    try {
      const data = await readChart(draft.question, draft.image, signal)
      setChartData(data)
      setStage('review')
    } catch (e) {
      const err = asGeminiError(e)
      if (err.kind !== 'aborted') setError(err)
      setStage('form')
    }
  }

  async function evaluate(confirmed: ChartData) {
    setError(null)
    setLastAction('evaluate')
    setChartData(confirmed)
    setStage('evaluating')
    const signal = runner.start()
    try {
      const id = await evaluateAndSave(
        {
          task: 'task1',
          question: draft.question,
          answer: draft.answer,
          chartData: confirmed,
          chartImage: draft.image?.dataUrl,
        },
        signal,
      )
      clearDraft('task1')
      navigate(`/results/${id}`)
    } catch (e) {
      const err = asGeminiError(e)
      if (err.kind !== 'aborted') setError(err)
      setStage('review')
    }
  }

  function cancel(back: Stage) {
    runner.cancel()
    setStage(back)
  }

  return (
    <div>
      <PageTitle title="IELTS Writing Task 1" subtitle="Academic: upload the chart, then paste the question and your answer." />
      <Stepper stage={stage} />

      {error && (
        <div className="mb-6">
          <ErrorBox
            error={error}
            returnTo="/task1"
            onRetry={lastAction === 'extract' ? extract : chartData ? () => evaluate(chartData) : undefined}
          />
        </div>
      )}

      {stage === 'form' && (
        <Card>
          <TaskForm task="task1" draft={draft} onChange={update} onSubmit={extract} />
        </Card>
      )}

      {stage === 'extracting' && (
        <Loading title="Reading your chart" steps={EXTRACT_STEPS} expectedSeconds={15} onCancel={() => cancel('form')} />
      )}

      {stage === 'review' && chartData && draft.image && (
        <ChartDataEditor
          key={JSON.stringify(chartData)}
          initial={chartData}
          imageUrl={draft.image.dataUrl}
          onConfirm={evaluate}
          onReread={extract}
          onBack={() => setStage('form')}
        />
      )}

      {stage === 'evaluating' && (
        <Loading title="Checking your answer" steps={EVALUATION_STEPS} expectedSeconds={30} onCancel={() => cancel('review')} />
      )}
    </div>
  )
}
