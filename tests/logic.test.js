import assert from 'node:assert/strict'
import test from 'node:test'
import { levelFromXp, levelProgress, scaledScore, scoreAnswer, xpToReach } from '../src/lib/game.ts'
import { emptyStat, isDue, mastery, schedule } from '../src/lib/srs.ts'

const DAY = 24 * 60 * 60 * 1000

test('a wrong answer never scores', () => {
  assert.equal(scoreAnswer({ correct: false, streak: 9, msTaken: 0, limitSeconds: 60 }), 0)
})

test('an untimed correct answer is worth the flat base', () => {
  assert.equal(scoreAnswer({ correct: true, streak: 0, msTaken: 5000, limitSeconds: null }), 100)
})

test('answering fast is worth more than answering slowly', () => {
  const fast = scoreAnswer({ correct: true, streak: 0, msTaken: 1000, limitSeconds: 60 })
  const slow = scoreAnswer({ correct: true, streak: 0, msTaken: 55000, limitSeconds: 60 })
  assert.ok(fast > slow, `${fast} should beat ${slow}`)
  assert.ok(fast <= 160, 'speed bonus caps at 60')
})

test('the streak multiplier tops out at 2x', () => {
  const ten = scoreAnswer({ correct: true, streak: 10, msTaken: 0, limitSeconds: null })
  const fifty = scoreAnswer({ correct: true, streak: 50, msTaken: 0, limitSeconds: null })
  assert.equal(ten, 200)
  assert.equal(fifty, 200)
})

test('levels line up with their XP thresholds', () => {
  assert.equal(levelFromXp(0), 1)
  assert.equal(levelFromXp(xpToReach(2) - 1), 1)
  assert.equal(levelFromXp(xpToReach(2)), 2)
  assert.equal(levelFromXp(xpToReach(7)), 7)
  const p = levelProgress(xpToReach(3) + 10)
  assert.equal(p.level, 3)
  assert.equal(p.into, 10)
  assert.ok(p.ratio > 0 && p.ratio < 1)
})

test('the exam scale runs 100 to 900', () => {
  assert.equal(scaledScore(0, 90), 100)
  assert.equal(scaledScore(90, 90), 900)
  assert.ok(scaledScore(76, 90) >= 750, 'about 82% should pass')
})

test('correct answers climb the Leitner boxes and misses fall back', () => {
  const now = Date.now()
  let stat = emptyStat()
  stat = schedule(stat, true, now)
  assert.equal(stat.box, 1)
  assert.equal(stat.correct, 1)
  assert.equal(stat.due, now + DAY)

  stat = schedule(stat, true, now)
  assert.equal(stat.box, 2)

  stat = schedule(stat, false, now)
  assert.equal(stat.box, 1, 'a miss drops back to box 1')
  assert.equal(stat.wrong, 1)
})

test('a question is due once its interval has elapsed', () => {
  const now = Date.now()
  const fresh = schedule(emptyStat(), true, now)
  assert.equal(isDue(fresh, now), false)
  assert.equal(isDue(fresh, now + DAY + 1), true)
  assert.equal(isDue(undefined, now), false, 'unseen questions are not "due"')
})

test('mastery grows with the box and retires at the top', () => {
  let stat = emptyStat()
  assert.equal(mastery(stat), 0)
  for (let i = 0; i < 5; i++) stat = schedule(stat, true)
  assert.equal(mastery(stat), 1)
  assert.equal(isDue(stat, Date.now() + 999 * DAY), false, 'retired questions stop coming back')
})
