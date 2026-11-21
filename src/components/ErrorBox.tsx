import { useNavigate } from 'react-router-dom'
import { needsSettings, userMessage, type GeminiError } from '../lib/gemini/errors'
import { getSettings } from '../lib/storage/settings'
import { Button, Notice } from './ui'

export default function ErrorBox({
  error,
  onRetry,
  returnTo,
}: {
  error: GeminiError
  onRetry?: () => void
  /** Page to come back to after fixing Settings. */
  returnTo?: string
}) {
  const navigate = useNavigate()
  const settings = needsSettings(error)
  return (
    <Notice tone="error">
      <p className="font-medium">{userMessage(error, getSettings().model)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {settings && (
          <Button variant="secondary" onClick={() => navigate('/settings', { state: { next: returnTo } })}>
            Open Settings
          </Button>
        )}
        {onRetry && error.kind !== 'no_key' && error.kind !== 'invalid_key' && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </Notice>
  )
}
