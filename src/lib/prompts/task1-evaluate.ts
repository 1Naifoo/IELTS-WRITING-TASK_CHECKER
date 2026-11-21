import type { ChartData } from '../schema'
import { COHERENCE, GENERAL_RULES, GRAMMAR, LEXICAL, TASK_ACHIEVEMENT } from './criteria'
import { issueRules, outputFormat, tagged } from './shared'

/** Confirmed chart data as compact readable text for the prompt. */
export function describeChartData(d: ChartData): string {
  const lines: string[] = [`Chart type: ${d.chart_type}`]
  if (d.title) lines.push(`Title: ${d.title}`)
  if (d.x_axis) lines.push(`Horizontal axis / columns: ${d.x_axis}`)
  if (d.y_axis) lines.push(`Vertical axis / rows: ${d.y_axis}`)
  if (d.units) lines.push(`Units: ${d.units}`)
  if (d.time_period) lines.push(`Time period: ${d.time_period}`)
  if (d.data_points.length) {
    lines.push('Data points:')
    for (const p of d.data_points) lines.push(`- ${p.label}: ${p.value}`)
  }
  if (d.trends.length) {
    lines.push('Main trends:')
    for (const t of d.trends) lines.push(`- ${t}`)
  }
  if (d.key_features.length) {
    lines.push('Key features:')
    for (const f of d.key_features) lines.push(`- ${f}`)
  }
  return lines.join('\n')
}

export function buildTask1EvaluatePrompt(question: string, answer: string, data: ChartData): string {
  return `Assess this IELTS Academic Writing Task 1 answer.

The chart data below was read from the image and CONFIRMED by the learner. It is the source of truth. Judge whether the answer matches it. Do not guess anything beyond it.
${tagged('confirmed_chart_data', describeChartData(data))}

${tagged('question', question)}

${tagged('answer', answer)}

Criteria:
${TASK_ACHIEVEMENT}

${COHERENCE}

${LEXICAL}

${GRAMMAR}

${GENERAL_RULES}

${issueRules('task1')}

Data accuracy:
- In "data_accuracy_notes", list where the answer's figures and claims match or contradict the confirmed data (up to 8 notes; contradictions first).
- When the answer contradicts the confirmed data, also add an issue with category "task" whose correction uses the confirmed value.

${outputFormat('task1')}`
}
