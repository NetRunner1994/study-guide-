import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import test from 'node:test'

const questions = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/data/questions.json', import.meta.url)), 'utf8'),
)

test('the bank is populated and ids are unique', () => {
  assert.ok(questions.length > 600, `expected 600+ questions, got ${questions.length}`)
  const ids = new Set(questions.map((q) => q.id))
  assert.equal(ids.size, questions.length)
})

test('every multiple-choice question is answerable', () => {
  for (const q of questions.filter((q) => q.type !== 'pbq')) {
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

test('single and multi types match the number of correct answers', () => {
  for (const q of questions.filter((q) => q.type !== 'pbq')) {
    const expected = q.answer.length > 1 ? 'multi' : 'single'
    assert.equal(q.type, expected, `#${q.id} is typed ${q.type}`)
  }
})

test('every question carries teaching material', () => {
  for (const q of questions) {
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

test('no extraction artifacts leak into the text', () => {
  const blob = JSON.stringify(questions)
  for (const artifact of ['Correct Answer', 'Why The Other Options', 'Question #', '✅']) {
    assert.ok(!blob.includes(artifact), `found leftover "${artifact}"`)
  }
})

test('every question is tagged with a known objective', () => {
  const valid = new Set(['1', '2', '3', '4', '5'])
  for (const q of questions) {
    assert.ok(valid.has(q.domain[0]), `#${q.id} has domain "${q.domain}"`)
  }
})
