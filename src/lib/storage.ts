import type { ExamProgress, Progress, Settings } from './types'

const KEY = 'secplus-arcade:progress:v2'
/** Single-exam layout used before the app covered more than Security+. */
const LEGACY_KEY = 'secplus-arcade:progress:v1'
/** The only exam that layout could have held. */
const LEGACY_EXAM_ID = 'sy0-701'

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  timer: true,
  shuffleOptions: false,
  instantFeedback: true,
}

export function emptyExamProgress(): ExamProgress {
  return { xp: 0, bestStreak: 0, stats: {}, history: [], badges: {} }
}

export function emptyProgress(): Progress {
  return {
    version: 2,
    /* Empty means "not chosen yet"; getExam() resolves it to the first exam in
       the catalog, so this module needs no knowledge of the catalog itself. */
    activeExam: '',
    dayStreak: 0,
    lastActiveDay: '',
    daily: {},
    settings: { ...DEFAULT_SETTINGS },
    exams: {},
  }
}

export function examProgress(progress: Progress, examId: string): ExamProgress {
  return progress.exams[examId] ?? emptyExamProgress()
}

export function today(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((parse(b) - parse(a)) / (24 * 60 * 60 * 1000))
}

/** Bump the day streak, resetting it when a day was skipped. */
export function touchDay(progress: Progress, day = today()): Progress {
  if (progress.lastActiveDay === day) return progress
  const gap = progress.lastActiveDay ? daysBetween(progress.lastActiveDay, day) : Infinity
  return {
    ...progress,
    lastActiveDay: day,
    dayStreak: gap === 1 ? progress.dayStreak + 1 : 1,
  }
}

/** Carry a pre-multi-exam save forward as this account's Security+ progress. */
function migrateFromV1(raw: string): Progress | null {
  try {
    const old = JSON.parse(raw) as Record<string, unknown>
    const base = emptyProgress()
    return {
      ...base,
      activeExam: LEGACY_EXAM_ID,
      dayStreak: (old.dayStreak as number) ?? 0,
      lastActiveDay: (old.lastActiveDay as string) ?? '',
      daily: (old.daily as Progress['daily']) ?? {},
      settings: { ...base.settings, ...((old.settings as Partial<Settings>) ?? {}) },
      exams: {
        [LEGACY_EXAM_ID]: {
          xp: (old.xp as number) ?? 0,
          bestStreak: (old.bestStreak as number) ?? 0,
          stats: (old.stats as ExamProgress['stats']) ?? {},
          history: (old.history as ExamProgress['history']) ?? [],
          badges: (old.badges as ExamProgress['badges']) ?? {},
        },
      },
    }
  } catch {
    return null
  }
}

export function loadProgress(): Progress {
  const base = emptyProgress()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      const migrated = legacy ? migrateFromV1(legacy) : null
      if (migrated) {
        saveProgress(migrated)
        return migrated
      }
      return base
    }
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      exams: parsed.exams ?? {},
      daily: parsed.daily ?? {},
    }
  } catch {
    return base
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    /* Storage can be full or blocked (private windows); progress just won't persist. */
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore */
  }
}
