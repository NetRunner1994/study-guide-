export type QuestionType = 'single' | 'multi' | 'pbq'

export interface Option {
  letter: string
  text: string
}

export interface Pair {
  item: string
  match: string
}

export interface Question {
  id: number
  type: QuestionType
  prompt: string[]
  domain: string
  /** Multiple-choice fields. */
  options?: Option[]
  answer?: string[]
  answerText?: string
  explanation?: string[]
  why?: Record<string, string>
  /** Performance-based (drag-and-drop / hotspot) fields. */
  format?: string
  summary?: string[]
  pairs?: Pair[]
  steps?: string[]
}

export type ModeId = 'quick' | 'domain' | 'sprint' | 'survival' | 'exam' | 'review'

export interface ModeConfig {
  id: ModeId
  name: string
  tagline: string
  icon: string
  /** Number of questions; `null` means endless. */
  count: number | null
  /** Seconds allowed per question, or `null` for untimed. */
  perQuestion: number | null
  /** Seconds allowed for the whole run, or `null`. */
  totalTime: number | null
  lives: number | null
  /** Show the verdict after each answer instead of only at the end. */
  instantFeedback: boolean
  accent: string
}

export interface QuestionStat {
  seen: number
  correct: number
  wrong: number
  /** Leitner box, 0 (new) through 5 (retired). */
  box: number
  /** Epoch ms when this question is next due for review. */
  due: number
  last: number
  flagged: boolean
  known: boolean
}

export interface SessionRecord {
  id: string
  mode: ModeId
  date: number
  total: number
  correct: number
  score: number
  durationMs: number
  domain: string | null
  scaled: number | null
  passed: boolean | null
}

export interface Settings {
  sound: boolean
  haptics: boolean
  timer: boolean
  shuffleOptions: boolean
  instantFeedback: boolean
}

/** Everything tracked for a single exam. Each exam progresses independently. */
export interface ExamProgress {
  xp: number
  bestStreak: number
  stats: Record<string, QuestionStat>
  history: SessionRecord[]
  badges: Record<string, number>
}

export interface Progress {
  version: number
  activeExam: string
  /** Streak and daily counts are global: studying any exam keeps them alive. */
  dayStreak: number
  lastActiveDay: string
  daily: Record<string, number>
  settings: Settings
  exams: Record<string, ExamProgress>
}

export interface AnswerOutcome {
  questionId: number
  picked: string[]
  correct: boolean
  points: number
  msTaken: number
}
