import { useMemo, useState } from 'react'
import { DISCLAIMER, LIMITS, SHORT_CRITERION } from '../configs/app'
import { formatBand } from '../lib/scoring'
import type { CriterionResult, EvaluationResult, Issue, IssueCategory } from '../lib/schema'
import type { Session } from '../lib/storage/sessions'
import { Card, Notice } from './ui'

/* ---------- band overview ---------- */

function bandColor(band: number): string {
  if (band >= 7) return 'text-emerald-700'
  if (band >= 6) return 'text-action-700'
  if (band >= 5) return 'text-amber-700'
  return 'text-red-700'
}

function BandOverview({ result }: { result: EvaluationResult }) {
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {result.criteria.map((c) => (
            <a
              key={c.name}
              href={`#criterion-${SHORT_CRITERION[c.name]}`}
              className="flex flex-col justify-between rounded-xl border border-mint-200 bg-mint-50 p-3 transition hover:border-accent-300"
            >
              <span className="text-xs font-medium leading-tight text-slate-600">{c.name}</span>
              <span className={`mt-2 text-3xl font-bold ${bandColor(c.band)}`}>{formatBand(c.band)}</span>
            </a>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-accent-600 px-8 py-5 text-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-100">Estimated overall band</span>
          <span className="text-6xl font-extrabold">{formatBand(result.overall_band)}</span>
          <span className="mt-1 text-xs text-accent-100">Confidence: {result.confidence}</span>
        </div>
      </div>
      {result.summary && <p className="mt-5 leading-relaxed text-slate-700">{result.summary}</p>}
    </Card>
  )
}

/* ---------- issue breakdown ---------- */

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  spelling: 'Spelling',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  cohesion: 'Cohesion',
  task: 'Task',
}

const CATEGORY_STYLE: Record<IssueCategory, string> = {
  spelling: 'bg-rose-100 text-rose-800',
  grammar: 'bg-action-100 text-action-700',
  vocabulary: 'bg-accent-100 text-accent-800',
  cohesion: 'bg-amber-100 text-amber-900',
  task: 'bg-mint-200 text-emerald-900',
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[issue.category]}`}>
          {CATEGORY_LABEL[issue.category]}
          {issue.rule ? ` · ${issue.rule}` : ''}
        </span>
        <span className="text-xs text-slate-400">{SHORT_CRITERION[issue.criterion] ?? issue.criterion}</span>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original</dt>
          <dd className="mt-0.5 rounded-lg bg-red-50 px-3 py-1.5 text-red-900 line-through decoration-red-300">
            {issue.original}
          </dd>
        </div>
        {issue.explanation && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why it is a problem</dt>
            <dd className="mt-0.5 text-slate-700">{issue.explanation}</dd>
          </div>
        )}
        {issue.correction && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Correction</dt>
            <dd className="mt-0.5 rounded-lg bg-mint-100 px-3 py-1.5 text-emerald-900">{issue.correction}</dd>
          </div>
        )}
        {issue.better_version && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Better version</dt>
            <dd className="mt-0.5 rounded-lg bg-accent-50 px-3 py-1.5 text-accent-800">{issue.better_version}</dd>
          </div>
        )}
      </dl>
    </li>
  )
}

function IssueGroup({ title, issues }: { title: string; issues: Issue[] }) {
  const [expanded, setExpanded] = useState(false)
  if (issues.length === 0) return null
  const shown = expanded ? issues : issues.slice(0, LIMITS.issuesShownPerGroup)
  return (
    <div>
      <h3 className="mb-2 font-semibold text-slate-800">
        {title} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{issues.length}</span>
      </h3>
      <ul className="space-y-3">
        {shown.map((i) => (
          <IssueCard key={i.id} issue={i} />
        ))}
      </ul>
      {issues.length > LIMITS.issuesShownPerGroup && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-sm font-medium text-action-700 hover:underline"
        >
          {expanded ? 'Show fewer' : `Show all ${issues.length}`}
        </button>
      )}
    </div>
  )
}

type Filter = 'all' | IssueCategory

function IssuesSection({ result }: { result: EvaluationResult }) {
  const [filter, setFilter] = useState<Filter>('all')
  const counts = useMemo(() => {
    const c: Record<IssueCategory, number> = { spelling: 0, grammar: 0, vocabulary: 0, cohesion: 0, task: 0 }
    for (const i of result.issues) c[i.category]++
    return c
  }, [result.issues])

  const visible = filter === 'all' ? result.issues : result.issues.filter((i) => i.category === filter)
  const spelling = visible.filter((i) => i.category === 'spelling')
  const grammar = visible.filter((i) => i.category === 'grammar')
  const other = visible.filter((i) => i.category !== 'spelling' && i.category !== 'grammar')

  const filters: Filter[] = ['all', 'spelling', 'grammar', 'vocabulary', 'cohesion', 'task']

  return (
    <Card>
      <h2 className="text-xl font-bold text-accent-800">Mistakes found in your answer</h2>
      <p className="mt-1 text-sm text-slate-500">
        Most important first. Every quote below was checked and really appears in your answer.
      </p>

      {result.issues.length === 0 ? (
        <Notice tone="success" className="mt-4">
          No clear mistakes were found. Check the criterion feedback below for ways to raise your band.
        </Notice>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter mistakes by type">
            {filters.map((f) => {
              const n = f === 'all' ? result.issues.length : counts[f]
              if (f !== 'all' && n === 0) return null
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${
                    filter === f
                      ? 'border-accent-600 bg-accent-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent-300'
                  }`}
                >
                  {f === 'all' ? 'All' : CATEGORY_LABEL[f]} ({n})
                </button>
              )
            })}
          </div>
          <div className="mt-5 space-y-6">
            <IssueGroup key={`s-${filter}`} title="Spelling errors" issues={spelling} />
            <IssueGroup key={`g-${filter}`} title="Grammar errors" issues={grammar} />
            <IssueGroup key={`o-${filter}`} title="Other issues (vocabulary, cohesion, task)" issues={other} />
          </div>
        </>
      )}
      {(result.issues_truncated || result.issues_discarded > 0) && (
        <p className="mt-4 text-xs text-slate-500">
          {result.issues_truncated && `Only the ${LIMITS.maxIssues} most important mistakes are shown; your answer has more. `}
          {result.issues_discarded > 0 &&
            `${result.issues_discarded} suggested mistake${result.issues_discarded === 1 ? ' was' : 's were'} hidden because the quote was not found in your answer.`}
        </p>
      )}
    </Card>
  )
}

/* ---------- criterion cards ---------- */

function CriterionCard({ criterion, issues }: { criterion: CriterionResult; issues: Issue[] }) {
  return (
    <Card className="scroll-mt-24">
      <div id={`criterion-${SHORT_CRITERION[criterion.name]}`} className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-accent-800">{criterion.name}</h3>
        <span className={`text-3xl font-bold ${bandColor(criterion.band)}`}>{formatBand(criterion.band)}</span>
      </div>
      {criterion.feedback_hidden ? (
        <p className="mt-2 text-sm text-slate-500">
          Detailed feedback is hidden because Gemini could not quote evidence from your answer for this criterion. The
          band is shown but is less reliable.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-1.5">
            {criterion.evidence.map((q) => (
              <li key={q} className="border-l-4 border-accent-300 bg-accent-50 px-3 py-1.5 text-sm italic text-slate-700">
                “{q}”
              </li>
            ))}
          </ul>
          {criterion.feedback && <p className="mt-3 leading-relaxed text-slate-700">{criterion.feedback}</p>}
        </>
      )}
      {criterion.next_step && (
        <p className="mt-3 rounded-xl bg-mint-100 px-4 py-2.5 text-sm text-emerald-900">
          <strong>Next step:</strong> {criterion.next_step}
        </p>
      )}
      {issues.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {issues.length} mistake{issues.length === 1 ? '' : 's'} above affect{issues.length === 1 ? 's' : ''} this criterion.
        </p>
      )}
    </Card>
  )
}

/* ---------- whole result ---------- */

export default function ResultView({ session }: { session: Session }) {
  const r = session.result
  const under = r.word_count < r.min_words

  return (
    <div className="space-y-6">
      <Notice tone="warning">
        <strong>{DISCLAIMER.title}</strong> {DISCLAIMER.full} {DISCLAIMER.rerun}
      </Notice>

      <BandOverview result={r} />

      <IssuesSection result={r} />

      <div className="grid gap-6 md:grid-cols-2">
        {r.criteria.map((c) => (
          <CriterionCard key={c.name} criterion={c} issues={r.issues.filter((i) => i.criterion === c.name)} />
        ))}
      </div>

      {r.task_type === 'task1' && r.data_accuracy_notes.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-accent-800">Data accuracy</h2>
          <p className="mt-1 text-sm text-slate-500">How your answer compares with the chart data you confirmed.</p>
          <ul className="mt-4 space-y-2">
            {r.data_accuracy_notes.map((n, i) => (
              <li
                key={i}
                className={`rounded-xl px-4 py-2.5 text-sm ${
                  n.status === 'contradicts' ? 'bg-red-50 text-red-900' : 'bg-mint-100 text-emerald-900'
                }`}
              >
                <span className="font-semibold">{n.status === 'contradicts' ? '✗ Does not match' : '✓ Matches'}:</span>{' '}
                {n.quote && <span className="italic">“{n.quote}” </span>}— {n.note}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {r.strengths.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-accent-800">Strengths</h2>
            <ul className="mt-3 space-y-2">
              {r.strengths.map((s) => (
                <li key={s} className="flex gap-2 text-slate-700">
                  <span className="text-emerald-600" aria-hidden="true">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {r.improvements.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-accent-800">What to improve first</h2>
            <ol className="mt-3 space-y-3">
              {r.improvements.map((imp) => (
                <li key={imp.priority} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-action-600 text-xs font-bold text-white">
                    {imp.priority}
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">{imp.issue}</p>
                    {imp.evidence && <p className="italic text-slate-500">“{imp.evidence}”</p>}
                    <p className="text-slate-700">{imp.action}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">Word count:</strong> {r.word_count}{' '}
            {under ? (
              <span className="font-medium text-amber-700">(under the {r.min_words}-word minimum; this lowers your band)</span>
            ) : (
              <span className="text-emerald-700">(meets the {r.min_words}-word minimum)</span>
            )}
          </p>
          <p>
            <strong className="text-slate-800">Checked by:</strong> Google Gemini ({r.model})
          </p>
          <p>
            <strong className="text-slate-800">Date:</strong> {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-action-700">Show your question and answer</summary>
          <div className="mt-3 space-y-3">
            {session.chartImage && (
              <img src={session.chartImage} alt="Your chart" className="max-h-72 rounded-lg border border-slate-200" />
            )}
            <div>
              <p className="font-semibold text-slate-700">Question</p>
              <p className="whitespace-pre-wrap text-slate-600">{session.question}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Your answer</p>
              <p className="whitespace-pre-wrap text-slate-600">{session.answer}</p>
            </div>
          </div>
        </details>
      </Card>
    </div>
  )
}
