import type { Progress, Settings } from './types'

const KEY = 'secplus-arcade:progress:v1'

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  timer: true,
  shuffleOptions: false,
  instantFeedback: true,
}

export function emptyProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    bestStreak: 0,
    dayStreak: 0,
    lastActiveDay: '',
    daily: {},
    stats: {},
    history: [],
    badges: {},
    settings: { ...DEFAULT_SETTINGS },
  }
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

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    const base = emptyProgress()
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      stats: parsed.stats ?? {},
      daily: parsed.daily ?? {},
      badges: parsed.badges ?? {},
      history: parsed.history ?? [],
    }
  } catch {
    return emptyProgress()
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
  } catch {
    /* ignore */
  }
}
