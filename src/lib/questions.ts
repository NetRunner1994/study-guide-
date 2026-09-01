import type { Question } from './types'

let cache: Question[] | null = null

export async function loadQuestions(): Promise<Question[]> {
  if (cache) return cache
  const module = await import('../data/questions.json')
  cache = (module.default ?? module) as unknown as Question[]
  return cache
}

export function plainText(q: Question): string {
  return [
    ...q.prompt,
    ...(q.options?.map((o) => o.text) ?? []),
    ...(q.explanation ?? []),
    ...(q.summary ?? []),
  ]
    .join(' ')
    .toLowerCase()
}

export function isCorrect(q: Question, picked: string[]): boolean {
  const answer = q.answer ?? []
  if (picked.length !== answer.length) return false
  return answer.every((letter) => picked.includes(letter))
}

/** Mulberry32 — a tiny deterministic PRNG so a seeded run is reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
