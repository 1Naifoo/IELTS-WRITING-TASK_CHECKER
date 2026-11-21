import type { TaskType } from '../configs/app'
import type { ChartImage } from './image'

/**
 * What the learner has typed so far, kept in memory while they move between
 * pages (for example to fix their key in Settings), so nothing is lost.
 * It is cleared when the tab is closed.
 */
export interface Draft {
  question: string
  answer: string
  image: ChartImage | null
}

const drafts: Record<TaskType, Draft> = {
  task1: { question: '', answer: '', image: null },
  task2: { question: '', answer: '', image: null },
}

export function getDraft(task: TaskType): Draft {
  return drafts[task]
}

export function setDraft(task: TaskType, patch: Partial<Draft>): void {
  drafts[task] = { ...drafts[task], ...patch }
}

export function clearDraft(task: TaskType): void {
  drafts[task] = { question: '', answer: '', image: null }
}
