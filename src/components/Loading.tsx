import { useEffect, useState } from 'react'
import { Button, Card } from './ui'

/**
 * Progress bar for a Gemini call. Gemini doesn't report real progress, so the
 * bar moves through named steps over time and only reaches 100% when the
 * answer arrives (the page then switches away).
 */
export default function Loading({
  title,
  steps,
  expectedSeconds = 25,
  onCancel,
}: {
  title: string
  steps: string[]
  expectedSeconds?: number
  onCancel?: () => void
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const t = setInterval(() => setElapsed((performance.now() - start) / 1000), 200)
    return () => clearInterval(t)
  }, [])

  // Eases towards 95% so a slow answer never looks finished.
  const percent = Math.min(95, Math.round(95 * (1 - Math.exp(-elapsed / (expectedSeconds / 2)))))
  const stepIndex = Math.min(steps.length - 1, Math.floor((percent / 95) * steps.length))

  return (
    <Card className="mx-auto max-w-xl text-center">
      <h2 className="text-lg font-semibold text-accent-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500" aria-live="polite">
        {steps[stepIndex]}…
      </p>
      <div
        className="mt-6 h-4 w-full overflow-hidden rounded-full bg-mint-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={title}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-accent-500 to-action-500 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-2xl font-bold text-accent-700">{percent}%</p>
      <ol className="mt-5 space-y-1 text-left text-sm">
        {steps.map((s, i) => (
          <li key={s} className={i < stepIndex ? 'text-emerald-700' : i === stepIndex ? 'font-medium text-accent-800' : 'text-slate-400'}>
            {i < stepIndex ? '✓' : i === stepIndex ? '•' : '○'} {s}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-xs text-slate-500">This usually takes 10–60 seconds. Please keep this page open.</p>
      {onCancel && (
        <Button variant="ghost" className="mt-3" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </Card>
  )
}
