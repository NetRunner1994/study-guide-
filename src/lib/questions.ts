import { getExam } from './exams'
import type { Question } from './types'

const cache = new Map<string, Question[]>()

export async function loadQuestions(examId: string): Promise<Question[]> {
  const cached = cache.get(examId)
  if (cached) return cached
  const questions = await getExam(examId).load()
  cache.set(examId, questions)
  return questions
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

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
