import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink, Card, Notice, PageTitle } from '../components/ui'
import { LIMITS, TASK_LABEL } from '../configs/app'
import { dateStamp, downloadText } from '../lib/download'
import { formatBand } from '../lib/scoring'
import { useSettings } from '../lib/storage/settings'
import {
  clearSessions,
  deleteSession,
  exportSessions,
  importSessions,
  listSessions,
  type SessionSummary,
} from '../lib/storage/sessions'

export default function History() {
  const { saveSessions } = useSettings()
  const [items, setItems] = useState<SessionSummary[] | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    listSessions().then(setItems)
  }, [])

  useEffect(refresh, [refresh])

  async function onDelete(id: string) {
    await deleteSession(id)
    refresh()
  }

  async function onDeleteAll() {
    if (!window.confirm('Delete all saved results from this browser? This cannot be undone.')) return
    await clearSessions()
    setMessage({ tone: 'success', text: 'All results were deleted.' })
    refresh()
  }

  async function onExport() {
    downloadText(`ielts-results-${dateStamp()}.json`, await exportSessions())
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('This file is too large.')
      const { imported, skipped } = await importSessions(await file.text())
      setMessage({
        tone: imported ? 'success' : 'error',
        text: `Imported ${imported} result${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} that could not be read` : ''}.`,
      })
      refresh()
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Import failed.' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Results history" subtitle={`Your last ${LIMITS.maxSessions} results, saved only in this browser.`} />

      {!saveSessions && (
        <Notice tone="info">
          Saving is switched off in Settings, so new results are kept only until you close this tab.
        </Notice>
      )}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card>
        {items === null ? (
          <p className="text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-slate-600">No results yet.</p>
            <ButtonLink to="/" className="mt-4">
              Check your first answer
            </ButtonLink>
          </div>
        ) : (
          <ul className="divide-y divide-mint-200">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-600 text-lg font-bold text-white">
                  {formatBand(s.band)}
                </span>
                <Link to={`/results/${s.id}`} className="min-w-0 flex-1 group">
                  <p className="font-semibold text-slate-800 group-hover:text-action-700">
                    {TASK_LABEL[s.task]}
                    <span className="ml-2 text-sm font-normal text-slate-500">{new Date(s.createdAt).toLocaleString()}</span>
                  </p>
                  <p className="truncate text-sm text-slate-500">{s.question}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(s.id)}
                  className="rounded-lg px-2.5 py-1.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete result from ${new Date(s.createdAt).toLocaleString()}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-accent-800">Move or back up your results</h2>
        <p className="mt-1 text-sm text-slate-600">
          Results live in this browser on this device only. Clearing your browser data deletes them. Export them to a
          file to keep a copy or move them to another browser. Your API key is never included.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onExport} disabled={!items?.length}>
            Export (JSON)
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => onImport(e.target.files?.[0])}
            aria-label="Import results file"
          />
          <Button variant="danger" onClick={onDeleteAll} disabled={!items?.length}>
            Delete all
          </Button>
        </div>
      </Card>
    </div>
  )
}
