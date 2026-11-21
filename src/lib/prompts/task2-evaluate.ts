import { COHERENCE, GENERAL_RULES, GRAMMAR, LEXICAL, TASK_RESPONSE } from './criteria'
import { issueRules, outputFormat, tagged } from './shared'

export function buildTask2EvaluatePrompt(question: string, answer: string): string {
  return `Assess this IELTS Writing Task 2 essay.

${tagged('question', question)}

${tagged('answer', answer)}

Criteria:
${TASK_RESPONSE}

${COHERENCE}

${LEXICAL}

${GRAMMAR}

${GENERAL_RULES}

${issueRules('task2')}

${outputFormat('task2')}`
}
