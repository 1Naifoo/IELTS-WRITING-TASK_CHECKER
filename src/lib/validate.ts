import { LIMITS, type TaskType } from '../configs/app'

export function countWords(text: string): number {
  const words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)
  return words ? words.length : 0
}

/** Share of letters that are Latin script (1 when there are no letters). */
export function latinRatio(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? []
  if (letters.length === 0) return 1
  const latin = letters.filter((c) => /\p{Script=Latin}/u.test(c)).length
  return latin / letters.length
}

export type Field = 'question' | 'answer' | 'image'

export interface InputCheck {
  /** Problems that block submitting. */
  errors: Partial<Record<Field, string>>
  /** Problems that are shown but do not block. */
  warnings: string[]
  wordCount: number
}

export function checkTextInput(
  task: TaskType,
  question: string,
  answer: string,
  hasImage = true,
): InputCheck {
  const errors: InputCheck['errors'] = {}
  const warnings: string[] = []
  const wordCount = countWords(answer)
  const minWords = LIMITS.minWords[task]

  if (!question.trim()) errors.question = 'Please enter the question.'
  else if (question.length > LIMITS.maxQuestionChars)
    errors.question = `The question is too long (max ${LIMITS.maxQuestionChars.toLocaleString()} characters).`

  if (!answer.trim()) errors.answer = 'Please enter your answer.'
  else if (answer.length > LIMITS.maxAnswerChars)
    errors.answer = `Your answer is too long (max ${LIMITS.maxAnswerChars.toLocaleString()} characters).`
  else if (wordCount < 20) errors.answer = 'Your answer is too short to evaluate (at least 20 words).'

  if (task === 'task1' && !hasImage) errors.image = 'Please upload the chart image.'

  if (answer.trim() && wordCount >= 20 && wordCount < minWords) {
    warnings.push(
      `Your answer has ${wordCount} words. ${task === 'task1' ? 'Task 1' : 'Task 2'} needs at least ${minWords}, and short answers lose marks.`,
    )
  }
  if (answer.trim() && latinRatio(answer) < 0.7) {
    warnings.push('Most of your answer does not look like English. IELTS answers must be written in English.')
  }

  return { errors, warnings, wordCount }
}
