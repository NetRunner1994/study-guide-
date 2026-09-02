import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import test from 'node:test'

/** Every exam bank the app ships, with the objectives it should tag against. */
const EXAMS = [
  { id: 'sy0-701', min: 600, domains: 5 },
  { id: '220-1201', min: 450, domains: 5 },
  { id: '220-1202', min: 380, domains: 4 },
]

const banks = EXAMS.map((exam) => ({
  ...exam,
  questions: JSON.parse(
    readFileSync(fileURLToPath(new URL(`../src/data/${exam.id}.json`, import.meta.url)), 'utf8'),
  ),
}))

for (const bank of banks) {
  test(`${bank.id}: bank is populated and ids are unique`, () => {
    assert.ok(
      bank.questions.length >= bank.min,
      `expected ${bank.min}+ questions, got ${bank.questions.length}`,
    )
    const ids = new Set(bank.questions.map((q) => q.id))
    assert.equal(ids.size, bank.questions.length)
  })

  test(`${bank.id}: every multiple-choice question is answerable`, () => {
    for (const q of bank.questions.filter((q) => q.type !== 'pbq')) {
      assert.ok(q.options.length >= 2, `#${q.id} has too few options`)
      const letters = q.options.map((o) => o.letter)
      assert.deepEqual(letters, letters.slice().sort(), `#${q.id} options are out of order`)
      assert.equal(letters[0], 'A', `#${q.id} does not start at A`)
      assert.ok(q.answer.length >= 1, `#${q.id} has no answer`)
      for (const letter of q.answer) {
        assert.ok(letters.includes(letter), `#${q.id} answer ${letter} is not an option`)
      }
      assert.ok(q.options.every((o) => o.text.trim()), `#${q.id} has a blank option`)
    }
  })

  test(`${bank.id}: single and multi types match the answer count`, () => {
    for (const q of bank.questions.filter((q) => q.type !== 'pbq')) {
      assert.equal(q.type, q.answer.length > 1 ? 'multi' : 'single', `#${q.id} is typed ${q.type}`)
    }
  })

  test(`${bank.id}: every question carries teaching material`, () => {
    for (const q of bank.questions) {
      assert.ok(q.prompt.length >= 1 && q.prompt.every((p) => p.trim()), `#${q.id} prompt is empty`)
      if (q.type === 'pbq') {
        assert.ok(q.pairs.length >= 1, `#${q.id} simulation has no pairs`)
      } else {
        assert.ok(q.explanation.length >= 1, `#${q.id} has no explanation`)
        const distractors = q.options.filter((o) => !q.answer.includes(o.letter))
        assert.equal(
          Object.keys(q.why).length,
          distractors.length,
          `#${q.id} does not explain every distractor`,
        )
      }
    }
  })

  test(`${bank.id}: no extraction artifacts leak into the text`, () => {
    const blob = JSON.stringify(bank.questions)
    for (const artifact of ['Correct Answer', 'Why The Other Options', 'Question #', '✅']) {
      assert.ok(!blob.includes(artifact), `found leftover "${artifact}"`)
    }
  })

  test(`${bank.id}: every objective is used and none is empty`, () => {
    const counts = new Map()
    for (const q of bank.questions) counts.set(q.domain, (counts.get(q.domain) ?? 0) + 1)
    assert.equal(
      counts.size,
      bank.domains,
      `expected ${bank.domains} objectives, saw ${[...counts.keys()].join(', ')}`,
    )
    for (const [domain, count] of counts) {
      assert.ok(count >= 10, `objective "${domain}" only has ${count} questions`)
    }
  })
}

test('exam banks do not share objective names', () => {
  const seen = new Map()
  for (const bank of banks) {
    for (const q of bank.questions) {
      const owner = seen.get(q.domain)
      assert.ok(
        owner === undefined || owner === bank.id,
        `objective "${q.domain}" appears in both ${owner} and ${bank.id}`,
      )
      seen.set(q.domain, bank.id)
    }
  }
})
