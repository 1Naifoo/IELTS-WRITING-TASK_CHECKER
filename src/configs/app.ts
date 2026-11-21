export const APP_NAME = 'IELTS Writing Checker'
export const AUTHOR = '1Naifoo'
export const REPO_URL = 'https://github.com/1Naifoo/IELTS-WRITING-TASK_CHECKER'

/** Used until the app can ask Gemini which models your key can use. */
export const DEFAULT_MODEL = 'gemini-2.5-flash'

export const LINKS = {
  aiStudioKey: 'https://aistudio.google.com/apikey',
  geminiTerms: 'https://ai.google.dev/gemini-api/terms',
  geminiRateLimits: 'https://ai.google.dev/gemini-api/docs/rate-limits',
  ielts: 'https://ielts.org',
} as const

export const DISCLAIMER = {
  title: 'Not an official IELTS tool.',
  short:
    'Not an official IELTS tool. Scores are AI-generated estimates for practice only and may not match your real exam result.',
  full:
    'This project is not affiliated with or endorsed by IELTS, IDP, the British Council, or Cambridge. Scores and feedback are AI-generated estimates. They can be inaccurate or inconsistent, and they are not a reliable prediction of your real exam result. Use them for practice only, and ask a qualified teacher or examiner for an official assessment.',
  rerun: 'Running the evaluation again may give a slightly different band.',
} as const

export const LIMITS = {
  minWords: { task1: 150, task2: 250 },
  maxQuestionChars: 2000,
  maxAnswerChars: 12000,
  maxImageBytes: 5 * 1024 * 1024,
  imageMaxSide: 1600,
  maxSessions: 50,
  maxIssues: 25,
  issuesShownPerGroup: 5,
} as const

export type TaskType = 'task1' | 'task2'

export const TASK_LABEL: Record<TaskType, string> = {
  task1: 'Task 1 (Academic)',
  task2: 'Task 2 (Essay)',
}

export const CRITERIA = {
  task1: [
    'Task Achievement',
    'Coherence and Cohesion',
    'Lexical Resource',
    'Grammatical Range and Accuracy',
  ],
  task2: [
    'Task Response',
    'Coherence and Cohesion',
    'Lexical Resource',
    'Grammatical Range and Accuracy',
  ],
} as const satisfies Record<TaskType, readonly string[]>

export const SHORT_CRITERION: Record<string, string> = {
  'Task Achievement': 'TA',
  'Task Response': 'TR',
  'Coherence and Cohesion': 'CC',
  'Lexical Resource': 'LR',
  'Grammatical Range and Accuracy': 'GRA',
}

/** Steps shown on the loading bar while Gemini checks an answer. */
export const EVALUATION_STEPS = [
  'Sending your answer to Gemini',
  'Reading your answer',
  'Checking spelling and grammar',
  'Scoring the four criteria',
  'Preparing your feedback',
]

export const EXTRACT_STEPS = ['Sending the chart to Gemini', 'Reading the chart', 'Listing the key data']
