import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import Loading from '../components/Loading'
import TaskForm from '../components/TaskForm'
import { Card, PageTitle } from '../components/ui'
import { EVALUATION_STEPS } from '../configs/app'
import { clearDraft, getDraft, setDraft, type Draft } from '../lib/drafts'
import { evaluateAndSave } from '../lib/flow'
import { asGeminiError, type GeminiError } from '../lib/gemini/errors'
import { useSettings } from '../lib/storage/settings'
import { useRunner } from '../lib/useRunner'

export default function Task2() {
  const { apiKey } = useSettings()
  const navigate = useNavigate()
  const runner = useRunner()
  const [draft, setDraftState] = useState<Draft>(() => getDraft('task2'))
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<GeminiError | null>(null)

  if (!apiKey) return <Navigate to="/settings" replace state={{ next: '/task2' }} />

  function update(patch: Partial<Draft>) {
    setDraft('task2', patch)
    setDraftState((d) => ({ ...d, ...patch }))
  }

  async function run() {
    setError(null)
    setRunning(true)
    const signal = runner.start()
    try {
      const id = await evaluateAndSave({ task: 'task2', question: draft.question, answer: draft.answer }, signal)
      clearDraft('task2')
      navigate(`/results/${id}`)
    } catch (e) {
      const err = asGeminiError(e)
      if (err.kind !== 'aborted') setError(err)
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title="IELTS Writing Task 2" subtitle="Paste the essay question and your answer." />
      {running ? (
        <Loading
          title="Checking your essay"
          steps={EVALUATION_STEPS}
          expectedSeconds={30}
          onCancel={() => {
            runner.cancel()
            setRunning(false)
          }}
        />
      ) : (
        <>
          {error && <ErrorBox error={error} onRetry={run} returnTo="/task2" />}
          <Card>
            <TaskForm task="task2" draft={draft} onChange={update} onSubmit={run} />
          </Card>
        </>
      )}
    </div>
  )
}
