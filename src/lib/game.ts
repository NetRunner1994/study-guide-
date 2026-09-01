import type { ModeConfig, ModeId, Progress, Question, SessionRecord } from './types'

export const MODES: Record<ModeId, ModeConfig> = {
  quick: {
    id: 'quick',
    name: 'Quick Play',
    tagline: '10 questions · beat the clock',
    icon: '⚡',
    count: 10,
    perQuestion: 45,
    totalTime: null,
    lives: null,
    instantFeedback: true,
    accent: '#22d3ee',
  },
  domain: {
    id: 'domain',
    name: 'Domain Drill',
    tagline: 'Target one exam objective',
    icon: '🎯',
    count: 15,
    perQuestion: 60,
    totalTime: null,
    lives: null,
    instantFeedback: true,
    accent: '#a78bfa',
  },
  sprint: {
    id: 'sprint',
    name: 'Sprint',
    tagline: '90 seconds · how many can you clear?',
    icon: '🔥',
    count: null,
    perQuestion: null,
    totalTime: 90,
    lives: null,
    instantFeedback: true,
    accent: '#fb7185',
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    tagline: '3 lives · endless questions',
    icon: '🛡️',
    count: null,
    perQuestion: 30,
    totalTime: null,
    lives: 3,
    instantFeedback: true,
    accent: '#34d399',
  },
  exam: {
    id: 'exam',
    name: 'Exam Simulation',
    tagline: '90 questions · 90 minutes · scored 100–900',
    icon: '📋',
    count: 90,
    perQuestion: null,
    totalTime: 90 * 60,
    lives: null,
    instantFeedback: false,
    accent: '#fbbf24',
  },
  review: {
    id: 'review',
    name: 'Smart Review',
    tagline: 'Questions you missed or flagged, when they are due',
    icon: '🔁',
    count: 20,
    perQuestion: null,
    totalTime: null,
    lives: null,
    instantFeedback: true,
    accent: '#f472b6',
  },
}

export const PASS_SCALED = 750

/** Points for one correct answer, before any bonuses. */
const BASE_POINTS = 100

export function scoreAnswer(opts: {
  correct: boolean
  streak: number
  msTaken: number
  limitSeconds: number | null
}): number {
  if (!opts.correct) return 0
  const speed = opts.limitSeconds
    ? Math.round(60 * Math.max(0, 1 - opts.msTaken / (opts.limitSeconds * 1000)))
    : 0
  const multiplier = 1 + Math.min(opts.streak, 10) * 0.1
  return Math.round((BASE_POINTS + speed) * multiplier)
}

export function xpForAnswer(points: number, correct: boolean): number {
  return correct ? 5 + Math.round(points / 10) : 1
}

/** Cumulative XP needed to reach a level: 100 * n(n+1)/2. */
export function xpToReach(level: number): number {
  const n = level - 1
  return (100 * n * (n + 1)) / 2
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpToReach(level + 1) <= xp) level += 1
  return level
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const floor = xpToReach(level)
  const ceiling = xpToReach(level + 1)
  return {
    level,
    into: xp - floor,
    span: ceiling - floor,
    ratio: (xp - floor) / (ceiling - floor),
  }
}

/** CompTIA reports 100–900 with 750 to pass; this mirrors that curve linearly. */
export function scaledScore(correct: number, total: number): number {
  if (!total) return 100
  return Math.round(100 + (correct / total) * 800)
}

export interface Badge {
  id: string
  name: string
  detail: string
  icon: string
}

export const BADGES: Badge[] = [
  { id: 'first-blood', name: 'First Contact', detail: 'Answer your first question', icon: '🌱' },
  { id: 'hot-streak', name: 'Hot Streak', detail: '10 correct in a row', icon: '🔥' },
  { id: 'inferno', name: 'Inferno', detail: '25 correct in a row', icon: '☄️' },
  { id: 'perfect-ten', name: 'Flawless', detail: 'A perfect Quick Play run', icon: '💎' },
  { id: 'centurion', name: 'Centurion', detail: 'Answer 100 questions', icon: '🏅' },
  { id: 'half-k', name: 'Marathoner', detail: 'Answer 500 questions', icon: '🎖️' },
  { id: 'sprinter', name: 'Speed Demon', detail: '15 correct in one Sprint', icon: '💨' },
  { id: 'survivor', name: 'Last One Standing', detail: 'Clear 25 in Survival', icon: '🛡️' },
  { id: 'exam-pass', name: 'Certified Mindset', detail: 'Pass an Exam Simulation', icon: '📜' },
  { id: 'exam-ace', name: 'Top of the Curve', detail: 'Score 850+ on an Exam Simulation', icon: '👑' },
  { id: 'week-warrior', name: 'Seven Day Streak', detail: 'Study 7 days in a row', icon: '📆' },
  { id: 'librarian', name: 'Librarian', detail: 'See every question in the bank at least once', icon: '📚' },
  { id: 'domain-1', name: 'Concepts Master', detail: '85% on 20+ General Concepts questions', icon: '🧠' },
  { id: 'domain-2', name: 'Threat Hunter', detail: '85% on 20+ Threats questions', icon: '🕵️' },
  { id: 'domain-3', name: 'Architect', detail: '85% on 20+ Architecture questions', icon: '🏗️' },
  { id: 'domain-4', name: 'Operator', detail: '85% on 20+ Operations questions', icon: '⚙️' },
  { id: 'domain-5', name: 'Governor', detail: '85% on 20+ Program Management questions', icon: '⚖️' },
]

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]))

/** Returns the badge ids newly earned given the progress state after a session. */
export function evaluateBadges(
  progress: Progress,
  questions: Question[],
  lastSession: SessionRecord | null,
  runBestStreak: number,
): string[] {
  const earned: string[] = []
  const add = (id: string) => {
    if (!progress.badges[id] && !earned.includes(id)) earned.push(id)
  }
  const values = Object.values(progress.stats)
  const answered = values.reduce((sum, s) => sum + s.correct + s.wrong, 0)

  if (answered >= 1) add('first-blood')
  if (progress.bestStreak >= 10 || runBestStreak >= 10) add('hot-streak')
  if (progress.bestStreak >= 25 || runBestStreak >= 25) add('inferno')
  if (answered >= 100) add('centurion')
  if (answered >= 500) add('half-k')
  if (progress.dayStreak >= 7) add('week-warrior')
  if (values.filter((s) => s.seen > 0).length >= questions.length) add('librarian')

  if (lastSession) {
    const { mode, correct, total, scaled } = lastSession
    if (mode === 'quick' && total >= 10 && correct === total) add('perfect-ten')
    if (mode === 'sprint' && correct >= 15) add('sprinter')
    if (mode === 'survival' && correct >= 25) add('survivor')
    if (mode === 'exam' && scaled !== null && scaled >= PASS_SCALED) add('exam-pass')
    if (mode === 'exam' && scaled !== null && scaled >= 850) add('exam-ace')
  }

  const byDomain = new Map<string, { correct: number; total: number }>()
  for (const q of questions) {
    const stat = progress.stats[q.id]
    if (!stat) continue
    const bucket = byDomain.get(q.domain) ?? { correct: 0, total: 0 }
    bucket.correct += stat.correct
    bucket.total += stat.correct + stat.wrong
    byDomain.set(q.domain, bucket)
  }
  for (const [domain, bucket] of byDomain) {
    if (bucket.total >= 20 && bucket.correct / bucket.total >= 0.85) {
      add(`domain-${domain[0]}`)
    }
  }
  return earned
}
