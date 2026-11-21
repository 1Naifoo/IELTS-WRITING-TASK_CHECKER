import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import Loading from '../components/Loading'
import ResultView from '../components/ResultView'
import { Button, ButtonLink, PageTitle } from '../components/ui'
import { EVALUATION_STEPS, TASK_LABEL } from '../configs/app'
import { dateStamp, downloadText } from '../lib/download'
import { evaluateAndSave } from '../lib/flow'
import { asGeminiError, type GeminiError } from '../lib/gemini/errors'
import { getSession, type Session } from '../lib/storage/sessions'
import { useRunner } from '../lib/useRunner'

export default function ResultPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const runner = useRunner()
  const [loaded, setLoaded] = useState<{ id: string; session: Session | null } | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<GeminiError | null>(null)

  useEffect(() => {
    let alive = true
    getSession(id).then((session) => {
      if (alive) setLoaded({ id, session })
    })
    return () => {
      alive = false
    }
  }, [id])

  const session = loaded?.id === id ? loaded.session : undefined
  if (session === undefined) return <p className="py-10 text-center text-slate-500">Loading result…</p>

  if (session === null) {
    return (
      <div className="py-10 text-center">
        <PageTitle title="Result not found" subtitle="It may have been deleted, or it was not saved on this browser." />
        <ButtonLink to="/results">See all results</ButtonLink>
      </div>
    )
  }

  const current = session

  async function evaluateAgain() {
    setError(null)
    setRunning(true)
    const signal = runner.start()
    try {
      const newId = await evaluateAndSave(
        {
          task: current.task,
          question: current.question,
          answer: current.answer,
          chartData: current.chartData,
          chartImage: current.chartImage,
        },
        signal,
      )
      setRunning(false)
      navigate(`/results/${newId}`)
    } catch (e) {
      const err = asGeminiError(e)
      if (err.kind !== 'aborted') setError(err)
      setRunning(false)
    }
  }

  function download() {
    const { chartImage: _image, ...rest } = current
    void _image
    downloadText(`ielts-${current.task}-result-${dateStamp(current.createdAt)}.json`, JSON.stringify(rest, null, 2))
  }

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button onClick={evaluateAgain} disabled={running}>
        Evaluate again
      </Button>
      <ButtonLink to={`/${current.task}`} variant="secondary">
        Start over
      </ButtonLink>
      <Button variant="secondary" onClick={download}>
        Download details (JSON)
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageTitle title="Your results" subtitle={TASK_LABEL[current.task]} />
        {!running && <div className="mb-6">{actions}</div>}
      </div>

      {error && <ErrorBox error={error} onRetry={evaluateAgain} />}

      {running ? (
        <Loading
          title="Evaluating your answer again"
          steps={EVALUATION_STEPS}
          expectedSeconds={30}
          onCancel={() => {
            runner.cancel()
            setRunning(false)
          }}
        />
      ) : (
        <>
          <ResultView session={current} />
          <div className="flex justify-center border-t border-mint-200 pt-6">{actions}</div>
        </>
      )}
    </div>
  )
}
