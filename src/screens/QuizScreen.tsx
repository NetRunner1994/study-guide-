import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DomainChip, QuestionDetail } from '../components/QuestionDetail'
import { CloseIcon, FlagIcon } from '../components/Icons'
import { MODES, scoreAnswer, scaledScore, xpForAnswer } from '../lib/game'
import { isCorrect, shuffle } from '../lib/questions'
import { buzz, play } from '../lib/feedback'
import { useStore } from '../state'
import type { AnswerOutcome, ModeId, Question, SessionRecord } from '../lib/types'

export interface QuizRun {
  mode: ModeId
  domain: string | null
  questions: Question[]
}

interface Props {
  run: QuizRun
  onExit: () => void
  onFinish: (record: SessionRecord, outcomes: AnswerOutcome[], earned: string[]) => void
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function QuizScreen({ run, onExit, onFinish }: Props) {
  const { progress, recordAnswer, finishSession, toggleFlag } = useStore()
  const config = MODES[run.mode]
  const { settings } = progress

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lives, setLives] = useState(config.lives ?? 0)
  const [outcomes, setOutcomes] = useState<AnswerOutcome[]>([])
  const [flash, setFlash] = useState<{ id: number; text: string; good: boolean } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [confirmExit, setConfirmExit] = useState(false)

  const runStart = useRef(Date.now())
  const questionStart = useRef(Date.now())
  const bodyRef = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  const question = run.questions.length
    ? run.questions[index % run.questions.length]
    : undefined

  /* Options are shuffled per question so the answer is not always in the same slot. */
  const options = useMemo(() => {
    if (!question?.options) return []
    return settings.shuffleOptions
      ? shuffle(question.options, mulberry(question.id))
      : question.options
  }, [question, settings.shuffleOptions])

  const perQuestionLimit = settings.timer ? config.perQuestion : null
  const timed = perQuestionLimit !== null || config.totalTime !== null

  useEffect(() => {
    if (!timed) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [timed])

  const questionRemaining = perQuestionLimit
    ? perQuestionLimit * 1000 - (now - questionStart.current)
    : null
  const runRemaining = config.totalTime ? config.totalTime * 1000 - (now - runStart.current) : null

  const answered = outcomes.length
  const correctCount = outcomes.filter((o) => o.correct).length

  const finish = useCallback(
    (finalOutcomes: AnswerOutcome[], finalScore: number, best: number) => {
      if (done.current) return
      done.current = true
      const total = finalOutcomes.length
      const correct = finalOutcomes.filter((o) => o.correct).length
      const scaled = run.mode === 'exam' ? scaledScore(correct, total || 1) : null
      const record: SessionRecord = {
        id: `${Date.now()}`,
        mode: run.mode,
        date: Date.now(),
        total,
        correct,
        score: finalScore,
        durationMs: Date.now() - runStart.current,
        domain: run.domain,
        scaled,
        passed: scaled === null ? null : scaled >= 750,
      }
      const earned = finishSession(record, best)
      play('finish', settings.sound)
      onFinish(record, finalOutcomes, earned)
    },
    [finishSession, onFinish, run.domain, run.mode, settings.sound],
  )

  const submit = useCallback(
    (choice: string[]) => {
      if (!question || locked) return
      const right = isCorrect(question, choice)
      const msTaken = Date.now() - questionStart.current
      const points = scoreAnswer({
        correct: right,
        streak,
        msTaken,
        limitSeconds: perQuestionLimit,
      })
      const nextStreak = right ? streak + 1 : 0
      const nextBest = Math.max(bestStreak, nextStreak)
      const outcome: AnswerOutcome = {
        questionId: question.id,
        picked: choice,
        correct: right,
        points,
        msTaken,
      }
      const nextOutcomes = [...outcomes, outcome]
      const nextScore = score + points

      setPicked(choice)
      setLocked(true)
      setOutcomes(nextOutcomes)
      setScore(nextScore)
      setStreak(nextStreak)
      setBestStreak(nextBest)
      recordAnswer(question.id, right, xpForAnswer(points, right))

      if (config.instantFeedback) {
        play(right ? 'correct' : 'wrong', settings.sound)
        buzz(right ? 18 : [22, 40, 22], settings.haptics)
        if (right) {
          setFlash({
            id: question.id,
            text: nextStreak >= 3 ? `+${points}  ×${(1 + Math.min(nextStreak, 10) * 0.1).toFixed(1)}` : `+${points}`,
            good: true,
          })
        }
      }

      const remainingLives = right ? lives : lives - 1
      if (config.lives !== null) setLives(remainingLives)

      const isLast = config.count !== null && nextOutcomes.length >= config.count
      const outOfLives = config.lives !== null && remainingLives <= 0
      if (outOfLives || (isLast && !config.instantFeedback)) {
        window.setTimeout(() => finish(nextOutcomes, nextScore, nextBest), outOfLives ? 900 : 250)
      }
    },
    [
      bestStreak,
      config.count,
      config.instantFeedback,
      config.lives,
      finish,
      lives,
      locked,
      outcomes,
      perQuestionLimit,
      question,
      recordAnswer,
      score,
      settings.haptics,
      settings.sound,
      streak,
    ],
  )

  const advance = useCallback(() => {
    const isLast = config.count !== null && outcomes.length >= config.count
    if (isLast) {
      finish(outcomes, score, bestStreak)
      return
    }
    setIndex((i) => i + 1)
    setPicked([])
    setLocked(false)
    setFlash(null)
    questionStart.current = Date.now()
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [bestStreak, config.count, finish, outcomes, score])

  /* Time limits: a spent per-question clock scores zero, a spent run clock ends it. */
  useEffect(() => {
    if (questionRemaining !== null && questionRemaining <= 0 && !locked) submit([])
  }, [questionRemaining, locked, submit])

  useEffect(() => {
    if (runRemaining !== null && runRemaining <= 0) finish(outcomes, score, bestStreak)
  }, [runRemaining, finish, outcomes, score, bestStreak])

  useEffect(() => {
    if (flash === null) return
    const id = window.setTimeout(() => setFlash(null), 800)
    return () => window.clearTimeout(id)
  }, [flash])

  /* Keyboard shortcuts make the app usable on a laptop too. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question) return
      const key = e.key.toUpperCase()
      if (key === 'ENTER') {
        if (locked) advance()
        else if (picked.length) submit(picked)
        return
      }
      const option = options.find((o) => o.letter === key)
      if (!option || locked) return
      onPick(option.letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!question) {
    return (
      <div className="quiz">
        <div className="empty">
          <span className="empty__icon">🗂️</span>
          <p>No questions matched this mode yet.</p>
          <button type="button" className="btn" onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    )
  }

  const multi = question.type === 'multi'
  const answer = question.answer ?? []

  function onPick(letter: string) {
    if (locked) return
    play('tap', settings.sound)
    if (multi) {
      setPicked((prev) =>
        prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter],
      )
      return
    }
    if (config.instantFeedback) submit([letter])
    else setPicked([letter])
  }

  const stat = progress.stats[question.id]
  const totalLabel = config.count ?? '∞'
  const progressRatio = config.count ? outcomes.length / config.count : 0
  const timerRatio =
    questionRemaining !== null && perQuestionLimit
      ? Math.max(0, questionRemaining / (perQuestionLimit * 1000))
      : runRemaining !== null && config.totalTime
        ? Math.max(0, runRemaining / (config.totalTime * 1000))
        : null

  const canSubmit = multi ? picked.length >= 2 : picked.length === 1

  return (
    <div className="quiz">
      {flash ? (
        <div className="combo" style={{ color: flash.good ? 'var(--good)' : 'var(--bad)' }}>
          {flash.text}
        </div>
      ) : null}

      <header className="quiz__head">
        <div className="row row--between">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => (outcomes.length ? setConfirmExit(true) : onExit())}
            aria-label="End session"
          >
            <CloseIcon />
          </button>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill mono">{config.icon} {outcomes.length + (locked ? 0 : 1)}/{totalLabel}</span>
            {config.lives !== null ? (
              <span className="hearts" aria-label={`${lives} lives left`}>
                {Array.from({ length: config.lives }).map((_, i) => (
                  <span key={i} className={i < lives ? '' : 'heart--lost'}>
                    ❤️
                  </span>
                ))}
              </span>
            ) : null}
            {streak >= 2 ? <span className="pill">🔥 {streak}</span> : null}
          </div>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => {
              toggleFlag(question.id)
              buzz(10, settings.haptics)
            }}
            aria-label={stat?.flagged ? 'Remove flag' : 'Flag for review'}
            style={{ color: stat?.flagged ? 'var(--warn)' : undefined }}
          >
            <FlagIcon filled={stat?.flagged} />
          </button>
        </div>

        <div className="quiz__meters">
          {config.count !== null ? (
            <div className="bar grow">
              <div className="bar__fill" style={{ width: `${Math.max(3, progressRatio * 100)}%` }} />
            </div>
          ) : (
            <span className="tiny faint grow">
              {config.lives !== null ? 'Endless — keep a life to keep going' : 'Endless — beat the clock'}
            </span>
          )}
          <span className="tiny mono muted" style={{ minWidth: 52, textAlign: 'right' }}>
            {score.toLocaleString()} pts
          </span>
        </div>

        {timerRatio !== null ? (
          <div className="timer-bar">
            <div
              className={`timer-bar__fill ${timerRatio < 0.25 ? 'timer-bar__fill--warn' : ''}`}
              style={{ width: `${timerRatio * 100}%`, transition: 'width .2s linear' }}
            />
          </div>
        ) : null}

        {runRemaining !== null ? (
          <div className="row row--between tiny muted">
            <DomainChip domain={question.domain} />
            <span className="mono">⏱ {formatClock(runRemaining)}</span>
          </div>
        ) : (
          <DomainChip domain={question.domain} />
        )}
      </header>

      <div className="quiz__body" ref={bodyRef}>
        <div className="prompt">
          {question.prompt.map((para, i) => (
            <p key={i} style={i < question.prompt.length - 1 ? { color: 'var(--muted)', fontWeight: 500 } : undefined}>
              {para}
            </p>
          ))}
        </div>

        <div className="options" role="group" aria-label="Answer options">
          {options.map((option) => {
            const isPicked = picked.includes(option.letter)
            const isRight = answer.includes(option.letter)
            let cls = 'option'
            if (locked && config.instantFeedback) {
              if (isRight) cls += ' option--correct'
              else if (isPicked) cls += ' option--wrong'
              else cls += ' option--muted'
            } else if (isPicked) {
              cls += ' option--picked'
            }
            return (
              <button
                key={option.letter}
                type="button"
                className={cls}
                onClick={() => onPick(option.letter)}
                disabled={locked}
                aria-pressed={isPicked}
              >
                <span className="option__key">{option.letter}</span>
                <span className="option__text">{option.text}</span>
              </button>
            )
          })}
        </div>

        {multi && !locked ? (
          <p className="tiny faint" style={{ marginTop: 10 }}>
            Select {answer.length} answers, then check.
          </p>
        ) : null}

        {locked && config.instantFeedback ? (
          <div
            className={`verdict ${outcomes[outcomes.length - 1]?.correct ? 'verdict--good' : 'verdict--bad'}`}
            style={{ marginTop: 16 }}
          >
            <div className="verdict__title">
              {outcomes[outcomes.length - 1]?.correct ? '✅ Correct' : '❌ Not quite'}
              {outcomes[outcomes.length - 1]?.points ? (
                <span className="pill mono">+{outcomes[outcomes.length - 1].points}</span>
              ) : null}
            </div>
            <QuestionDetail question={question} showOptions={false} />
          </div>
        ) : null}
      </div>

      <footer className="quiz__foot">
        {locked && config.instantFeedback ? (
          <button type="button" className="btn btn--primary btn--block" onClick={advance}>
            {config.count !== null && outcomes.length >= config.count ? 'See results' : 'Next question'}
          </button>
        ) : config.instantFeedback && !multi ? null : (
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={!canSubmit}
            onClick={() => {
              if (config.instantFeedback) {
                submit(picked)
                return
              }
              const isLast = config.count !== null && outcomes.length + 1 >= config.count
              submit(picked)
              if (!isLast) window.setTimeout(advance, 60)
            }}
          >
            {canSubmit
              ? config.instantFeedback
                ? 'Check answer'
                : 'Next'
              : multi
                ? `Select ${Math.max(1, answer.length - picked.length)} more`
                : 'Pick an answer'}
          </button>
        )}
        {!config.instantFeedback ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--block"
            onClick={() => finish(outcomes, score, bestStreak)}
          >
            End exam and score it
          </button>
        ) : null}
        <p className="tiny faint center">
          {answered ? `${correctCount}/${answered} correct this run` : 'Tap an option to answer'}
        </p>
      </footer>

      {confirmExit ? (
        <div className="sheet" role="dialog" aria-modal="true" onClick={() => setConfirmExit(false)}>
          <div className="sheet__panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17 }}>End this run?</h2>
            <p className="small muted">
              You have answered {answered} question{answered === 1 ? '' : 's'}. Ending now scores
              what you have completed.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => finish(outcomes, score, bestStreak)}
            >
              End and score
            </button>
            <button type="button" className="btn btn--block" onClick={() => setConfirmExit(false)}>
              Keep going
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Seeded shuffle so a question's options keep the same order while it is on screen. */
function mulberry(seed: number) {
  let a = (seed * 2654435761) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
