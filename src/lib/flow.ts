import type { TaskType } from '../configs/app'
import { evaluateAnswer, extractChartData } from './evaluate'
import type { ChartImage } from './image'
import type { ChartData } from './schema'
import { getSettings } from './storage/settings'
import { newSessionId, saveSession, type Session } from './storage/sessions'

export function connection(signal?: AbortSignal) {
  const { apiKey, model } = getSettings()
  return { apiKey, model, signal }
}

export function readChart(question: string, image: ChartImage, signal?: AbortSignal) {
  return extractChartData(connection(signal), question, image)
}

/** Runs the evaluation, saves the session and returns its id. */
export async function evaluateAndSave(
  input: { task: TaskType; question: string; answer: string; chartData?: ChartData; chartImage?: string },
  signal?: AbortSignal,
): Promise<string> {
  const conn = connection(signal)
  const result = await evaluateAnswer(conn, input)
  const session: Session = {
    id: newSessionId(),
    createdAt: Date.now(),
    task: input.task,
    question: input.question,
    answer: input.answer,
    model: conn.model,
    chartData: input.chartData,
    chartImage: input.chartImage,
    result,
  }
  await saveSession(session, getSettings().saveSessions)
  return session.id
}
