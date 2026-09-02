import { useMemo, useState } from 'react'
import { ProgressRing } from '../components/ProgressRing'
import { QuestionDetail } from '../components/QuestionDetail'
import { badgeById, MODES, PASS_SCALED, levelFromXp } from '../lib/game'
import { useStore } from '../state'
import type { AnswerOutcome, ModeId, Question, SessionRecord } from '../lib/types'

interface Props {
  record: SessionRecord
  outcomes: AnswerOutcome[]
  earned: string[]
  questions: Question[]
  onReplay: (mode: ModeId, domain?: string) => void
  onHome: () => void
}

export function ResultsScreen({ record, outcomes, earned, questions, onReplay, onHome }: Props) {
  const { exam, current } = useStore()
  const [showMisses, setShowMisses] = useState(false)
  const config = MODES[record.mode]
  const accuracy = record.total ? record.correct / record.total : 0

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])
  const missed = outcomes.filter((o) => !o.correct)

  const headline =
    record.mode === 'exam'
      ? record.passed
        ? 'Pass'
        : 'Not yet'
      : accuracy >= 0.9
        ? 'Outstanding'
        : accuracy >= 0.7
          ? 'Solid run'
          : accuracy >= 0.5
            ? 'Keep grinding'
            : 'Back to the guide'

  const minutes = Math.floor(record.durationMs / 60000)
  const seconds = Math.floor((record.durationMs % 60000) / 1000)

  return (
    <div className="screen screen--flush stack">
      <header className="center stack--sm" style={{ paddingTop: 12 }}>
        <p className="eyebrow">{config.name}</p>
        <h1 style={{ fontSize: 26 }}>{headline}</h1>
      </header>

      <div className="result-ring">
        <ProgressRing value={accuracy} size={168} stroke={14}>
          <div>
            {record.scaled !== null ? (
              <>
                <div className="result-score mono">{record.scaled}</div>
                <div className="tiny faint">of 900 · {PASS_SCALED} to pass</div>
              </>
            ) : (
              <>
                <div className="result-score mono">{Math.round(accuracy * 100)}%</div>
                <div className="tiny faint">
                  {record.correct}/{record.total} correct
                </div>
              </>
            )}
          </div>
        </ProgressRing>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value mono">{record.score.toLocaleString()}</div>
          <div className="stat__label">Points</div>
        </div>
        <div className="stat">
          <div className="stat__value mono">
            {record.correct}/{record.total}
          </div>
          <div className="stat__label">Correct</div>
        </div>
        <div className="stat">
          <div className="stat__value mono">
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="stat__label">Time</div>
        </div>
      </div>

      {earned.length ? (
        <section className="stack--sm">
          <span className="eyebrow">Badges unlocked</span>
          {earned.map((id) => {
            const badge = badgeById(exam, id)
            if (!badge) return null
            return (
              <div className="badge-pop" key={id}>
                <span className="badge-pop__icon">{badge.icon}</span>
                <div>
                  <strong className="small">{badge.name}</strong>
                  <p className="tiny muted">{badge.detail}</p>
                </div>
              </div>
            )
          })}
        </section>
      ) : null}

      <section className="card stack--sm">
        <div className="row row--between">
          <span className="eyebrow">Level {levelFromXp(current.xp)}</span>
          <span className="tiny mono faint">{current.xp.toLocaleString()} XP on {exam.code}</span>
        </div>
        <p className="small muted">
          {missed.length
            ? `${missed.length} question${missed.length === 1 ? '' : 's'} went into Smart Review — they will come back until they stick.`
            : 'Nothing missed. Those questions move further down the review schedule.'}
        </p>
      </section>

      {missed.length ? (
        <button
          type="button"
          className="btn btn--block"
          onClick={() => setShowMisses((v) => !v)}
        >
          {showMisses ? 'Hide' : 'Review'} the {missed.length} missed
        </button>
      ) : null}

      {showMisses ? (
        <div className="stack--sm">
          {missed.map((outcome) => {
            const question = byId.get(outcome.questionId)
            if (!question) return null
            return (
              <div className="entry" key={outcome.questionId}>
                <div className="entry__head">
                  <span className="tiny faint mono">#{question.id}</span>
                  <span className="entry__q">{question.prompt[question.prompt.length - 1]}</span>
                </div>
                <div className="entry__body">
                  <QuestionDetail question={question} />
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="stack--sm">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => onReplay(record.mode, record.domain ?? undefined)}
        >
          Play again
        </button>
        <button type="button" className="btn btn--block" onClick={onHome}>
          Back to home
        </button>
      </div>
    </div>
  )
}

