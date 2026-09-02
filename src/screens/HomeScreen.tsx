import { useMemo, useState } from 'react'
import { ExamButton, ExamSheet } from '../components/ExamPicker'
import { ProgressRing } from '../components/ProgressRing'
import { domainMeta } from '../lib/exams'
import { MODES, levelProgress } from '../lib/game'
import { isDue } from '../lib/srs'
import { useStore } from '../state'
import type { ModeId } from '../lib/types'

interface Props {
  onPlay: (mode: ModeId, domain?: string) => void
  onOpenStudy: () => void
  installPrompt: (() => void) | null
}

export function HomeScreen({ onPlay, onOpenStudy, installPrompt }: Props) {
  const { exam, questions, progress, current } = useStore()
  const [pickExam, setPickExam] = useState(false)

  const summary = useMemo(() => {
    const stats = Object.values(current.stats)
    const answered = stats.reduce((n, s) => n + s.correct + s.wrong, 0)
    const correct = stats.reduce((n, s) => n + s.correct, 0)
    const seen = stats.filter((s) => s.seen > 0).length
    const due = questions.filter((q) => isDue(current.stats[q.id])).length
    const flagged = stats.filter((s) => s.flagged).length
    return {
      answered,
      correct,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
      coverage: questions.length ? seen / questions.length : 0,
      seen,
      due,
      flagged,
    }
  }, [current.stats, questions])

  const level = levelProgress(current.xp)
  const weakest = useMemo(() => {
    const buckets = exam.domains.map((d) => {
      let correct = 0
      let total = 0
      for (const q of questions) {
        if (q.domain !== d.id) continue
        const stat = current.stats[q.id]
        if (!stat) continue
        correct += stat.correct
        total += stat.correct + stat.wrong
      }
      return { domain: d, accuracy: total >= 5 ? correct / total : null, total }
    }).filter((b) => b.accuracy !== null)
    buckets.sort((a, b) => (a.accuracy as number) - (b.accuracy as number))
    return buckets[0] ?? null
  }, [current.stats, questions, exam.domains])

  return (
    <div className="screen stack">
      <header className="stack--sm" style={{ marginBottom: 16 }}>
        <div className="row row--between">
          <ExamButton onOpen={() => setPickExam(true)} />
          <span className="pill" title="Day streak">
            🔥 {progress.dayStreak}
          </span>
        </div>
        <div>
          <p className="eyebrow">{exam.family}</p>
          <h1 className="topbar__title">{exam.code} Arcade</h1>
          <p className="topbar__sub">
            {questions.length} practice questions with full explanations
          </p>
        </div>
      </header>

      {installPrompt ? (
        <div className="install-banner">
          <span style={{ fontSize: 22 }}>📲</span>
          <div className="grow">
            <strong className="small">Install the app</strong>
            <p className="tiny muted">Add it to your home screen and study offline.</p>
          </div>
          <button type="button" className="btn btn--sm btn--primary" onClick={installPrompt}>
            Install
          </button>
        </div>
      ) : null}

      {pickExam ? <ExamSheet onClose={() => setPickExam(false)} /> : null}

      <section className="hero row" style={{ gap: 16 }}>
        <ProgressRing value={level.ratio} size={96}>
          <div>
            <div className="ring__value">Lv {level.level}</div>
            <div className="tiny faint mono">{level.into}/{level.span} XP</div>
          </div>
        </ProgressRing>
        <div className="grow stack--sm" style={{ position: 'relative' }}>
          <p className="eyebrow">Bank coverage</p>
          <div className="row" style={{ gap: 8 }}>
            <div className="bar grow">
              <div className="bar__fill" style={{ width: `${summary.coverage * 100}%` }} />
            </div>
            <span className="tiny mono muted">{Math.round(summary.coverage * 100)}%</span>
          </div>
          <p className="tiny muted">
            {summary.seen} of {questions.length} questions seen · {summary.accuracy}% lifetime accuracy
          </p>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value mono">{summary.answered.toLocaleString()}</div>
          <div className="stat__label">Answered</div>
        </div>
        <div className="stat">
          <div className="stat__value mono">{current.bestStreak}</div>
          <div className="stat__label">Best streak</div>
        </div>
        <div className="stat">
          <div className="stat__value mono">{summary.due}</div>
          <div className="stat__label">Due for review</div>
        </div>
      </div>

      <section className="stack--sm">
        <div className="row row--between">
          <h2 style={{ fontSize: 16 }}>Jump back in</h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onOpenStudy}>
            Browse guide
          </button>
        </div>
        <button
          type="button"
          className="mode"
          style={{ ['--mode-accent' as string]: MODES.quick.accent }}
          onClick={() => onPlay('quick')}
        >
          <span className="mode__icon">{MODES.quick.icon}</span>
          <span className="mode__name">{MODES.quick.name}</span>
          <span className="mode__tag">{MODES.quick.tagline}</span>
        </button>
        <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button
            type="button"
            className="mode"
            style={{ ['--mode-accent' as string]: MODES.review.accent }}
            onClick={() => onPlay('review')}
          >
            <span className="mode__icon">{MODES.review.icon}</span>
            <span className="mode__name">Smart Review</span>
            <span className="mode__tag">
              {summary.due ? `${summary.due} due now` : summary.flagged ? `${summary.flagged} flagged` : 'Fresh questions'}
            </span>
          </button>
          {weakest ? (
            <button
              type="button"
              className="mode"
              style={{ ['--mode-accent' as string]: domainMeta(exam, weakest.domain.id).accent }}
              onClick={() => onPlay('domain', weakest.domain.id)}
            >
              <span className="mode__icon">🎯</span>
              <span className="mode__name">Weakest area</span>
              <span className="mode__tag">
                {weakest.domain.short} · {Math.round((weakest.accuracy as number) * 100)}%
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="mode"
              style={{ ['--mode-accent' as string]: MODES.exam.accent }}
              onClick={() => onPlay('exam')}
            >
              <span className="mode__icon">{MODES.exam.icon}</span>
              <span className="mode__name">Exam Sim</span>
              <span className="mode__tag">90 questions, 90 minutes</span>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
