import { MODES } from './game'
import { isDue } from './srs'
import { shuffle } from './questions'
import type { ModeId, Progress, Question } from './types'

export interface SessionRequest {
  mode: ModeId
  domain?: string | null
  /** Only used by Smart Review when nothing is due yet. */
  includeUnseen?: boolean
}

/** How many questions to queue for endless modes before they wrap. */
const ENDLESS_POOL = 120

function weightedPool(questions: Question[], progress: Progress): Question[] {
  /* Prefer questions that are new or shaky, without ever excluding the rest. */
  const scored = questions.map((q) => {
    const stat = progress.stats[q.id]
    if (!stat || stat.seen === 0) return { q, weight: 3 }
    const accuracy = stat.correct / Math.max(1, stat.correct + stat.wrong)
    return { q, weight: 1 + (1 - accuracy) * 2 + (isDue(stat) ? 1.5 : 0) }
  })
  const out: Question[] = []
  for (const { q, weight } of scored) {
    const copies = Math.max(1, Math.round(weight))
    for (let i = 0; i < copies; i++) out.push(q)
  }
  return out
}

function dedupe(questions: Question[]): Question[] {
  const seen = new Set<number>()
  return questions.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)))
}

export function buildSession(
  all: Question[],
  progress: Progress,
  request: SessionRequest,
): Question[] {
  const config = MODES[request.mode]
  const bank = all.filter((q) => q.type !== 'pbq')

  if (request.mode === 'review') {
    const flagged = bank.filter((q) => progress.stats[q.id]?.flagged)
    const due = bank.filter((q) => isDue(progress.stats[q.id]))
    const missed = bank.filter((q) => (progress.stats[q.id]?.wrong ?? 0) > 0)
    let pool = dedupe([...due, ...flagged, ...missed])
    if (pool.length === 0 && request.includeUnseen !== false) {
      pool = bank.filter((q) => !progress.stats[q.id]?.seen)
    }
    return shuffle(pool).slice(0, config.count ?? pool.length)
  }

  if (request.mode === 'domain' && request.domain) {
    const pool = bank.filter((q) => q.domain === request.domain)
    return dedupe(shuffle(weightedPool(pool, progress))).slice(0, config.count ?? pool.length)
  }

  if (request.mode === 'exam') {
    /* Spread the 90 questions across domains the way the objectives are weighted. */
    const byDomain = new Map<string, Question[]>()
    for (const q of bank) {
      const list = byDomain.get(q.domain) ?? []
      list.push(q)
      byDomain.set(q.domain, list)
    }
    const target = config.count ?? 90
    const picked: Question[] = []
    for (const [, list] of byDomain) {
      const share = Math.round((list.length / bank.length) * target)
      picked.push(...shuffle(list).slice(0, share))
    }
    const filler = shuffle(bank.filter((q) => !picked.includes(q)))
    while (picked.length < target && filler.length) picked.push(filler.pop() as Question)
    return shuffle(picked).slice(0, target)
  }

  const pool = dedupe(shuffle(weightedPool(bank, progress)))
  return pool.slice(0, config.count ?? Math.min(ENDLESS_POOL, pool.length))
}
