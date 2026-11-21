import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, ExternalLink, Notice, PageTitle } from '../components/ui'
import { LINKS } from '../configs/app'
import { listModels, MODEL_ID_PATTERN, pickDefaultModel, type ModelInfo } from '../lib/gemini/client'
import { asGeminiError, userMessage } from '../lib/gemini/errors'
import { clearApiKey, getSettings, updateSettings, useSettings } from '../lib/storage/settings'

type Status = { tone: 'success' | 'error' | 'warning' | 'info'; text: string } | null

const ALLOWED_NEXT = new Set(['/task1', '/task2'])

function maskKey(key: string): string {
  return key.length <= 8 ? '••••' : `${key.slice(0, 4)}••••••••${key.slice(-4)}`
}

export default function Settings() {
  const settings = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const nextRaw = (location.state as { next?: string } | null)?.next
  const next = nextRaw && ALLOWED_NEXT.has(nextRaw) ? nextRaw : null

  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelInput, setModelInput] = useState(settings.model)

  async function loadModels(apiKey: string): Promise<ModelInfo[]> {
    const list = await listModels(apiKey)
    setModels(list)
    return list
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const key = keyInput.trim()
    if (!key) {
      setStatus({ tone: 'error', text: 'Please paste your Gemini API key.' })
      return
    }
    if (key.length > 200 || /\s/.test(key)) {
      setStatus({ tone: 'error', text: 'That does not look like an API key. Copy it again from Google AI Studio.' })
      return
    }
    setBusy(true)
    setStatus({ tone: 'info', text: 'Checking your key with Gemini…' })
    try {
      const list = await loadModels(key)
      const ids = list.map((m) => m.id)
      // First key: pick the best default. Replacing a key: keep the chosen model if it still works.
      const current = getSettings()
      const model = current.apiKey && ids.includes(current.model) ? current.model : pickDefaultModel(ids)
      updateSettings({ apiKey: key, model })
      setModelInput(model)
      setKeyInput('')
      setStatus({ tone: 'success', text: `Key saved and working. Using model "${model}".` })
    } catch (err) {
      const ge = asGeminiError(err)
      if (ge.kind === 'network') {
        updateSettings({ apiKey: key })
        setKeyInput('')
        setStatus({ tone: 'warning', text: 'Key saved, but it could not be checked because Gemini could not be reached. Check your connection.' })
      } else {
        setStatus({ tone: 'error', text: `Key not saved. ${userMessage(ge)}` })
      }
    } finally {
      setBusy(false)
    }
  }

  async function onTest() {
    setBusy(true)
    setStatus({ tone: 'info', text: 'Testing your key…' })
    try {
      const list = await loadModels(settings.apiKey)
      setStatus({ tone: 'success', text: `Your key works. ${list.length} models are available.` })
    } catch (err) {
      setStatus({ tone: 'error', text: userMessage(asGeminiError(err)) })
    } finally {
      setBusy(false)
    }
  }

  function onClear() {
    clearApiKey()
    setModels([])
    setStatus({ tone: 'success', text: 'Your key was removed from this browser.' })
  }

  function onModelSave(value: string) {
    const v = value.trim()
    setModelInput(v)
    if (!MODEL_ID_PATTERN.test(v)) {
      setStatus({ tone: 'error', text: 'Model names can only contain letters, numbers, dots, dashes and underscores.' })
      return
    }
    updateSettings({ model: v })
    setStatus({ tone: 'success', text: `Model set to "${v}".` })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle title="Settings" subtitle="Connect your own Gemini API key. This app only works with Gemini." />

      {next && !settings.apiKey && (
        <Notice tone="accent">Add your Gemini API key to start {next === '/task1' ? 'Task 1' : 'Task 2'}.</Notice>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">Gemini API key</h2>
        <p className="mt-1 text-sm text-slate-600">
          Get a free key from <ExternalLink href={LINKS.aiStudioKey}>Google AI Studio</ExternalLink> (sign in with a
          Google account, then choose <em>Create API key</em>). No billing is needed for the free tier.
        </p>

        {settings.apiKey && (
          <p className="mt-4 rounded-xl bg-mint-100 px-4 py-3 text-sm text-emerald-900">
            Saved key: <code className="font-mono">{maskKey(settings.apiKey)}</code>
            {!settings.rememberKey && ' (this visit only)'}
          </p>
        )}

        <form onSubmit={onSave} className="mt-4 space-y-3" autoComplete="off">
          <label htmlFor="api-key" className="block text-sm font-medium text-slate-700">
            {settings.apiKey ? 'Replace key' : 'Paste your key'}
          </label>
          <div className="flex gap-2">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIza…"
              autoComplete="off"
              spellCheck={false}
              maxLength={200}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm focus:border-action-500 focus:outline-none"
            />
            <Button variant="secondary" onClick={() => setShowKey((s) => !s)} aria-pressed={showKey}>
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-accent-600"
              checked={!settings.rememberKey}
              onChange={(e) => updateSettings({ rememberKey: !e.target.checked })}
            />
            <span>
              Don't remember my key <span className="text-slate-500">(keep it only until this tab is closed)</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={busy || !keyInput.trim()}>
              {busy ? 'Checking…' : 'Save'}
            </Button>
            {settings.apiKey && (
              <>
                <Button variant="secondary" onClick={onTest} disabled={busy}>
                  Test key
                </Button>
                <Button variant="danger" onClick={onClear} disabled={busy}>
                  Clear key
                </Button>
              </>
            )}
          </div>
        </form>

        {status && (
          <Notice tone={status.tone} className="mt-4">
            {status.text}
          </Notice>
        )}

        {next && settings.apiKey && (
          <Button className="mt-4" onClick={() => navigate(next)}>
            Continue to {next === '/task1' ? 'Task 1' : 'Task 2'} →
          </Button>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          Your key stays in this browser and is sent only to Google's Gemini API. Anyone using this device could access
          it, so clear it when you are done on a shared computer.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">Model</h2>
        <p className="mt-1 text-sm text-slate-600">
          The Gemini model that checks your writing. The app picks a fast model automatically when you save your key.
        </p>
        {models.length > 0 ? (
          <select
            value={models.some((m) => m.id === settings.model) ? settings.model : ''}
            onChange={(e) => onModelSave(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-action-500 focus:outline-none"
            aria-label="Gemini model"
          >
            {!models.some((m) => m.id === settings.model) && <option value="">{settings.model} (not in list)</option>}
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName ? `${m.displayName} (${m.id})` : m.id}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              aria-label="Gemini model name"
              spellCheck={false}
              maxLength={100}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm focus:border-action-500 focus:outline-none"
            />
            <Button variant="secondary" onClick={() => onModelSave(modelInput)} disabled={modelInput.trim() === settings.model}>
              Use model
            </Button>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {settings.apiKey && models.length === 0 ? 'Press "Test key" to choose from the models your key can use. ' : ''}
          If you run out of free quota on one model, another model often still has quota left.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">Saved results</h2>
        <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-accent-600"
            checked={!settings.saveSessions}
            onChange={(e) => updateSettings({ saveSessions: !e.target.checked })}
          />
          <span>
            Don't save my results <span className="text-slate-500">(recommended on shared computers)</span>
          </span>
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Results are saved only in this browser. They are never uploaded anywhere.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">About the free tier</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
          <li>
            Gemini's free tier has limits on requests per minute and per day.{' '}
            <ExternalLink href={LINKS.geminiRateLimits}>See the current limits</ExternalLink>.
          </li>
          <li>
            Your question, answer and chart image are sent directly from this browser to Google. Google's terms may
            allow free-tier requests to be used to improve its products.{' '}
            <ExternalLink href={LINKS.geminiTerms}>Read the Gemini API terms</ExternalLink>.
          </li>
          <li>Avoid putting personal information in your essays.</li>
        </ul>
      </Card>
    </div>
  )
}
