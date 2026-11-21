import { useId, useRef, useState, type FormEvent } from 'react'
import { LIMITS, LINKS, type TaskType } from '../configs/app'
import type { Draft } from '../lib/drafts'
import { checkImageFile, compressImage } from '../lib/image'
import { checkTextInput } from '../lib/validate'
import { Button, ExternalLink, Notice } from './ui'

const textareaClass =
  'w-full rounded-xl border bg-white px-3 py-2.5 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-action-100'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  )
}

export default function TaskForm({
  task,
  draft,
  onChange,
  onSubmit,
}: {
  task: TaskType
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
  onSubmit: () => void
}) {
  const ids = { image: useId(), question: useId(), answer: useId() }
  const fileRef = useRef<HTMLInputElement>(null)
  const [tried, setTried] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)

  const check = checkTextInput(task, draft.question, draft.answer, task === 'task2' || !!draft.image)
  const errors = tried ? check.errors : {}
  const allFilled = !!draft.question.trim() && !!draft.answer.trim() && (task === 'task2' || !!draft.image)
  const minWords = LIMITS.minWords[task]

  async function onFile(file: File | undefined) {
    setImageError(null)
    if (!file) return
    const problem = await checkImageFile(file)
    if (problem) {
      setImageError(problem)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setImageBusy(true)
    try {
      onChange({ image: await compressImage(file) })
    } catch {
      setImageError('This image could not be read. Try a different JPG or PNG file.')
    } finally {
      setImageBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setTried(true)
    if (Object.keys(check.errors).length === 0 && !imageBusy) onSubmit()
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {task === 'task1' && (
        <div>
          <label htmlFor={ids.image} className="block font-semibold text-slate-800">
            Upload the chart <span className="text-red-600">*</span>
          </label>
          <p className="text-sm text-slate-500">JPG or PNG, up to {Math.round(LIMITS.maxImageBytes / 1024 / 1024)} MB.</p>
          <div
            className={`mt-2 rounded-2xl border-2 border-dashed p-4 ${
              errors.image || imageError ? 'border-red-300 bg-red-50' : 'border-mint-300 bg-mint-50'
            }`}
          >
            {draft.image ? (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <img src={draft.image.dataUrl} alt="Uploaded chart" className="max-h-48 rounded-lg border border-slate-200 bg-white" />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                    Change image
                  </Button>
                  <Button variant="ghost" onClick={() => onChange({ image: null })}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-1 py-6 text-slate-600"
                disabled={imageBusy}
              >
                <span className="text-3xl" aria-hidden="true">📊</span>
                <span className="font-medium text-action-700">{imageBusy ? 'Preparing image…' : 'Choose an image'}</span>
              </button>
            )}
            <input
              ref={fileRef}
              id={ids.image}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
              aria-describedby={`${ids.image}-err`}
            />
          </div>
          <FieldError id={`${ids.image}-err`} message={imageError ?? errors.image} />
        </div>
      )}

      <div>
        <label htmlFor={ids.question} className="block font-semibold text-slate-800">
          The question <span className="text-red-600">*</span>
        </label>
        <textarea
          id={ids.question}
          value={draft.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={task === 'task1' ? 3 : 4}
          maxLength={LIMITS.maxQuestionChars}
          required
          aria-invalid={!!errors.question}
          aria-describedby={`${ids.question}-err`}
          placeholder={
            task === 'task1'
              ? 'e.g. The chart below shows… Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
              : 'e.g. Some people believe that… To what extent do you agree or disagree?'
          }
          className={`${textareaClass} ${errors.question ? 'border-red-400' : 'border-slate-300'}`}
        />
        <FieldError id={`${ids.question}-err`} message={errors.question} />
      </div>

      <div>
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={ids.answer} className="block font-semibold text-slate-800">
            Your answer <span className="text-red-600">*</span>
          </label>
          <span
            className={`text-sm font-medium ${check.wordCount >= minWords ? 'text-emerald-700' : 'text-slate-500'}`}
            aria-live="polite"
          >
            {check.wordCount} / {minWords} words
          </span>
        </div>
        <textarea
          id={ids.answer}
          value={draft.answer}
          onChange={(e) => onChange({ answer: e.target.value })}
          rows={task === 'task1' ? 12 : 16}
          maxLength={LIMITS.maxAnswerChars}
          required
          spellCheck={false}
          aria-invalid={!!errors.answer}
          aria-describedby={`${ids.answer}-err`}
          placeholder="Paste or type your answer here."
          className={`${textareaClass} ${errors.answer ? 'border-red-400' : 'border-slate-300'}`}
        />
        <FieldError id={`${ids.answer}-err`} message={errors.answer} />
        <p className="mt-1 text-xs text-slate-500">Spell-check is off so your real mistakes can be found.</p>
      </div>

      {check.warnings.length > 0 && (
        <Notice tone="warning">
          {check.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </Notice>
      )}

      <div className="flex flex-col gap-3 border-t border-mint-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 sm:max-w-md">
          Your {task === 'task1' ? 'question, answer and image are' : 'question and answer are'} sent to Google Gemini
          under <ExternalLink href={LINKS.geminiTerms}>Google's terms</ExternalLink>. Avoid personal information.
        </p>
        <Button type="submit" className="px-8 py-3 text-base" disabled={!allFilled || imageBusy}>
          Submit
        </Button>
      </div>
    </form>
  )
}
