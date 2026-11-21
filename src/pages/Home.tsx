import { Link } from 'react-router-dom'
import { Notice } from '../components/ui'
import { DISCLAIMER, LIMITS } from '../configs/app'
import { useSettings } from '../lib/storage/settings'
import { useStartTask } from '../lib/useStartTask'

function TaskButton({
  title,
  description,
  details,
  onClick,
}: {
  title: string
  description: string
  details: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start rounded-2xl border-2 border-action-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-action-500 hover:shadow-md"
    >
      <span className="text-2xl font-bold text-accent-800">{title}</span>
      <span className="mt-2 text-slate-600">{description}</span>
      <span className="mt-1 text-sm text-slate-500">{details}</span>
      <span className="mt-5 inline-flex items-center rounded-xl bg-action-600 px-4 py-2 text-sm font-semibold text-white group-hover:bg-action-700">
        Start →
      </span>
    </button>
  )
}

export default function Home() {
  const start = useStartTask()
  const { apiKey } = useSettings()

  return (
    <div className="space-y-8">
      <section className="pt-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Free · Open source · Private</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-accent-800 sm:text-4xl">
          Welcome to IELTS Writing practice
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Paste your question and answer and get feedback on the four IELTS Writing criteria, with your mistakes
          explained and corrected, using your own free Gemini API key.
        </p>
      </section>

      <Notice tone="warning" className="mx-auto max-w-3xl">
        {DISCLAIMER.short}
      </Notice>

      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        <TaskButton
          title="IELTS Task 1"
          description="Academic: describe a graph, chart, table, map or process."
          details={`Upload the chart · at least ${LIMITS.minWords.task1} words`}
          onClick={() => start('task1')}
        />
        <TaskButton
          title="IELTS Task 2"
          description="Essay: respond to a point of view, argument or problem."
          details={`At least ${LIMITS.minWords.task2} words`}
          onClick={() => start('task2')}
        />
      </div>

      <p className="text-center text-sm text-slate-600">
        {apiKey ? (
          <>
            Your Gemini key is set. <Link to="/results" className="font-medium text-action-700 underline">See past results</Link>
          </>
        ) : (
          <>
            First time here? <Link to="/settings" className="font-medium text-action-700 underline">Add your free Gemini API key</Link> to get started.
          </>
        )}
      </p>
    </div>
  )
}
