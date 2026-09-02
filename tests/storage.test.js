import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'

/** Minimal localStorage stand-in so the storage module can run under node. */
class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null
  }
  setItem(k, v) {
    this.map.set(k, String(v))
  }
  removeItem(k) {
    this.map.delete(k)
  }
}

globalThis.localStorage = new MemoryStorage()

const { loadProgress, saveProgress, emptyProgress, examProgress, touchDay, today } = await import(
  '../src/lib/storage.ts'
)

const V1_KEY = 'secplus-arcade:progress:v1'
const V2_KEY = 'secplus-arcade:progress:v2'

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('a fresh install has no exam chosen and no progress', () => {
  const progress = loadProgress()
  assert.equal(progress.version, 2)
  assert.equal(progress.activeExam, '', 'resolved to the catalog default at read time')
  assert.deepEqual(progress.exams, {})
})

test('a pre-multi-exam save is migrated into the Security+ slot', () => {
  globalThis.localStorage.setItem(
    V1_KEY,
    JSON.stringify({
      version: 1,
      xp: 4200,
      bestStreak: 14,
      dayStreak: 5,
      lastActiveDay: '2026-09-01',
      daily: { '2026-09-01': 30 },
      stats: { 12: { seen: 3, correct: 2, wrong: 1, box: 2, due: 99, last: 1, flagged: true, known: false } },
      history: [{ id: 'a', mode: 'quick', total: 10, correct: 8 }],
      badges: { 'first-blood': 123 },
      settings: { sound: false, timer: false },
    }),
  )

  const progress = loadProgress()
  const security = examProgress(progress, 'sy0-701')

  assert.equal(progress.version, 2)
  assert.equal(progress.activeExam, 'sy0-701')
  assert.equal(security.xp, 4200, 'XP survives the migration')
  assert.equal(security.bestStreak, 14)
  assert.equal(security.stats[12].correct, 2, 'per-question review state survives')
  assert.equal(security.stats[12].flagged, true, 'flags survive')
  assert.equal(security.history.length, 1, 'session history survives')
  assert.equal(security.badges['first-blood'], 123, 'earned badges survive')
  assert.equal(progress.dayStreak, 5, 'the day streak stays global')
  assert.equal(progress.settings.sound, false, 'settings survive')
  assert.equal(progress.settings.haptics, true, 'unset settings fall back to defaults')
  assert.deepEqual(examProgress(progress, '220-1201'), {
    xp: 0,
    bestStreak: 0,
    stats: {},
    history: [],
    badges: {},
  })
})

test('migration is written back so it only happens once', () => {
  globalThis.localStorage.setItem(V1_KEY, JSON.stringify({ xp: 10, stats: {} }))
  loadProgress()
  assert.ok(globalThis.localStorage.getItem(V2_KEY), 'a v2 record is saved')
  globalThis.localStorage.removeItem(V1_KEY)
  assert.equal(examProgress(loadProgress(), 'sy0-701').xp, 10, 'still readable without the v1 key')
})

test('corrupt saved data falls back to a clean slate instead of throwing', () => {
  globalThis.localStorage.setItem(V2_KEY, '{not json')
  const progress = loadProgress()
  assert.equal(progress.version, 2)
  assert.deepEqual(progress.exams, {})
})

test('exam progress round-trips through save and load', () => {
  const progress = emptyProgress()
  progress.activeExam = '220-1202'
  progress.exams['220-1202'] = { xp: 55, bestStreak: 3, stats: {}, history: [], badges: {} }
  saveProgress(progress)

  const loaded = loadProgress()
  assert.equal(loaded.activeExam, '220-1202')
  assert.equal(examProgress(loaded, '220-1202').xp, 55)
})

test('the day streak grows on consecutive days and resets after a gap', () => {
  const base = { ...emptyProgress(), lastActiveDay: '2026-09-01', dayStreak: 3 }
  assert.equal(touchDay(base, '2026-09-02').dayStreak, 4, 'next day continues the streak')
  assert.equal(touchDay(base, '2026-09-04').dayStreak, 1, 'a skipped day resets it')
  assert.equal(touchDay(base, '2026-09-01').dayStreak, 3, 'same day leaves it alone')
  assert.match(today(new Date(2026, 8, 5)), /^2026-09-05$/)
})
