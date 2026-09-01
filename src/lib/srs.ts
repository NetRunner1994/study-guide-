import type { QuestionStat } from './types'

/** Days a question waits in each Leitner box before it is due again. */
const INTERVALS = [0, 1, 2, 4, 9, 21]
const DAY = 24 * 60 * 60 * 1000

export function emptyStat(): QuestionStat {
  return { seen: 0, correct: 0, wrong: 0, box: 0, due: 0, last: 0, flagged: false, known: false }
}

/** Move a question up one box when answered correctly, back to box 1 when missed. */
export function schedule(stat: QuestionStat, correct: boolean, now = Date.now()): QuestionStat {
  const box = correct ? Math.min(stat.box + 1, INTERVALS.length - 1) : 1
  return {
    ...stat,
    seen: stat.seen + 1,
    correct: stat.correct + (correct ? 1 : 0),
    wrong: stat.wrong + (correct ? 0 : 1),
    box,
    last: now,
    due: now + INTERVALS[box] * DAY,
  }
}

export function isDue(stat: QuestionStat | undefined, now = Date.now()): boolean {
  if (!stat || stat.seen === 0) return false
  return stat.box < INTERVALS.length - 1 && stat.due <= now
}

/** How well a question is known, 0–1, used for the mastery meters. */
export function mastery(stat: QuestionStat | undefined): number {
  if (!stat || stat.seen === 0) return 0
  return Math.min(1, stat.box / (INTERVALS.length - 1))
}
