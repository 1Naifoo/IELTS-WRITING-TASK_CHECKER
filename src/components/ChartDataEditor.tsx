import { useState } from 'react'
import { CHART_TYPES, type ChartData, type DataPoint } from '../lib/schema'
import { Button, Card, Notice } from './ui'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-action-500 focus:outline-none'

const toLines = (list: string[]) => list.join('\n')
const fromLines = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

/**
 * Step B of the Task 1 data check: the learner reviews and fixes what Gemini
 * read from the chart. The confirmed data becomes the source of truth.
 */
export default function ChartDataEditor({
  initial,
  imageUrl,
  onConfirm,
  onReread,
  onBack,
}: {
  initial: ChartData
  imageUrl: string
  onConfirm: (data: ChartData) => void
  onReread: () => void
  onBack: () => void
}) {
  const [meta, setMeta] = useState({
    chart_type: initial.chart_type,
    title: initial.title,
    x_axis: initial.x_axis,
    y_axis: initial.y_axis,
    units: initial.units,
    time_period: initial.time_period,
  })
  const [rows, setRows] = useState<DataPoint[]>(
    initial.data_points.length ? initial.data_points : [{ label: '', value: '', uncertain: false }],
  )
  const [trends, setTrends] = useState(toLines(initial.trends))
  const [features, setFeatures] = useState(toLines(initial.key_features))
  const [error, setError] = useState<string | null>(null)

  const uncertainCount = rows.filter((r) => r.uncertain).length

  function setRow(index: number, patch: Partial<DataPoint>) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch, uncertain: false } : r)))
  }

  function confirm() {
    const data_points = rows
      .map((r) => ({ ...r, label: r.label.trim(), value: r.value.trim() }))
      .filter((r) => r.label || r.value)
    const t = fromLines(trends)
    const f = fromLines(features)
    if (!data_points.length && !t.length && !f.length) {
      setError('Add at least one data point or key feature so your answer can be checked.')
      return
    }
    onConfirm({
      ...meta,
      title: meta.title.trim(),
      x_axis: meta.x_axis.trim(),
      y_axis: meta.y_axis.trim(),
      units: meta.units.trim(),
      time_period: meta.time_period.trim(),
      data_points: data_points.map((r) => ({ ...r, uncertain: false })),
      trends: t,
      key_features: f,
      uncertain_items: [],
    })
  }

  const metaFields: Array<[keyof typeof meta, string]> = [
    ['title', 'Title'],
    ['units', 'Units'],
    ['x_axis', 'Horizontal axis / columns'],
    ['y_axis', 'Vertical axis / rows'],
    ['time_period', 'Time period'],
  ]

  return (
    <div className="space-y-6">
      <Notice tone="accent">
        <p className="font-semibold">Check the chart details</p>
        <p>
          Gemini read these details from your image. Compare them with the chart and fix anything that is wrong.
          Your answer will be checked against <strong>this data</strong>, so it needs to be correct.
        </p>
      </Notice>

      {(uncertainCount > 0 || initial.uncertain_items.length > 0) && (
        <Notice tone="warning">
          <p className="font-semibold">Please double-check the highlighted items.</p>
          {initial.uncertain_items.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {initial.uncertain_items.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          )}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit lg:sticky lg:top-20">
          <h2 className="mb-3 font-semibold text-accent-800">Your chart</h2>
          <img src={imageUrl} alt="The chart you uploaded" className="w-full rounded-lg border border-slate-200" />
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-accent-800">Overview</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Chart type</span>
                <select
                  value={meta.chart_type}
                  onChange={(e) => setMeta({ ...meta, chart_type: e.target.value as ChartData['chart_type'] })}
                  className={inputClass}
                >
                  {CHART_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              {metaFields.map(([key, label]) => (
                <label key={key} className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">{label}</span>
                  <input
                    value={meta[key]}
                    maxLength={300}
                    onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-accent-800">Data points</h2>
            <p className="mb-3 text-sm text-slate-500">One row per value, e.g. "Japan, 2010" → "45%".</p>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex flex-wrap items-center gap-2 rounded-lg p-1.5 sm:flex-nowrap ${
                    row.uncertain ? 'bg-amber-50 ring-1 ring-amber-300' : ''
                  }`}
                >
                  <input
                    value={row.label}
                    onChange={(e) => setRow(i, { label: e.target.value })}
                    placeholder="Label"
                    aria-label={`Row ${i + 1} label`}
                    maxLength={200}
                    className={`${inputClass} sm:flex-[3]`}
                  />
                  <input
                    value={row.value}
                    onChange={(e) => setRow(i, { value: e.target.value })}
                    placeholder="Value"
                    aria-label={`Row ${i + 1} value`}
                    maxLength={200}
                    className={`${inputClass} sm:flex-[2]`}
                  />
                  {row.uncertain && <span className="text-xs font-semibold whitespace-nowrap text-amber-800">Check</span>}
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                    className="rounded-lg px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove row ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setRows((rs) => [...rs, { label: '', value: '', uncertain: false }])}
            >
              + Add row
            </Button>
          </Card>

          <Card>
            <label className="block">
              <span className="font-semibold text-accent-800">Main trends</span>
              <span className="mb-2 block text-sm text-slate-500">One per line.</span>
              <textarea value={trends} onChange={(e) => setTrends(e.target.value)} rows={4} maxLength={3000} className={inputClass} />
            </label>
            <label className="mt-4 block">
              <span className="font-semibold text-accent-800">Key features and comparisons</span>
              <span className="mb-2 block text-sm text-slate-500">Highest and lowest values, notable comparisons. One per line.</span>
              <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} maxLength={3000} className={inputClass} />
            </label>
          </Card>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col-reverse gap-2 border-t border-mint-200 pt-5 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            ← Back to my answer
          </Button>
          <Button variant="secondary" onClick={onReread}>
            Re-read the image
          </Button>
        </div>
        <Button className="px-6 py-3 text-base" onClick={confirm}>
          Looks correct, continue →
        </Button>
      </div>
    </div>
  )
}
