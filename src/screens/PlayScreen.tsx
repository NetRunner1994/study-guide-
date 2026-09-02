import { useState } from 'react'
import { Sheet } from '../components/Sheet'

import { MODES } from '../lib/game'
import { isDue } from '../lib/srs'
import { useStore } from '../state'
import type { ModeId } from '../lib/types'

interface Props {
  onPlay: (mode: ModeId, domain?: string) => void
}

const ORDER: ModeId[] = ['quick', 'sprint', 'survival', 'domain', 'review', 'exam']

export function PlayScreen({ onPlay }: Props) {
  const { exam, questions, current } = useStore()
  const [pickDomain, setPickDomain] = useState(false)

  const due = questions.filter((q) => isDue(current.stats[q.id])).length
  const bestExam = current.history
    .filter((h) => h.mode === 'exam' && h.scaled !== null)
    .reduce((best, h) => Math.max(best, h.scaled ?? 0), 0)

  return (
    <div className="screen stack">
      <header className="topbar">
        <div>
          <p className="eyebrow">Game modes</p>
          <h1 className="topbar__title">Play</h1>
          <p className="topbar__sub">{exam.name} · {exam.code}</p>
        </div>
      </header>

      <div className="mode-grid">
        {ORDER.map((id) => {
          const mode = MODES[id]
          const note =
            id === 'review' && due
              ? `${due} question${due === 1 ? '' : 's'} due`
              : id === 'exam' && bestExam
                ? `Best scaled score ${bestExam}`
                : mode.tagline
          return (
            <button
              key={id}
              type="button"
              className="mode"
              style={{ ['--mode-accent' as string]: mode.accent }}
              onClick={() => (id === 'domain' ? setPickDomain(true) : onPlay(id))}
            >
              <span className="mode__icon">{mode.icon}</span>
              <span className="mode__name">{mode.name}</span>
              <span className="mode__tag">{note}</span>
            </button>
          )
        })}
      </div>

      <section className="card stack--sm">
        <span className="eyebrow">How scoring works</span>
        <p className="small muted">
          Every correct answer is worth 100 points, plus up to 60 for speed when a clock is
          running. Answer streaks multiply the total, up to 2× at ten in a row. Points convert to
          XP, XP raises your level, and milestones unlock badges.
        </p>
        <p className="small muted">
          Exam Simulation mirrors the real thing: 90 questions in 90 minutes, no feedback until
          you finish, and a scaled score out of 900 where 750 passes.
        </p>
      </section>

      {pickDomain ? (
        <Sheet title="Pick an objective" onClose={() => setPickDomain(false)}>
          <div className="stack--sm">
            {exam.domains.map((domain) => {
              const count = questions.filter((q) => q.domain === domain.id).length
              return (
                <button
                  key={domain.id}
                  type="button"
                  className="btn btn--block"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => {
                    setPickDomain(false)
                    onPlay('domain', domain.id)
                  }}
                >
                  <span className="row" style={{ gap: 9 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 99,
                        background: domain.accent,
                        display: 'inline-block',
                      }}
                    />
                    {domain.short}
                  </span>
                  <span className="tiny faint mono">
                    {count} Q{domain.weight ? ` · ${domain.weight}%` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </Sheet>
      ) : null}
    </div>
  )
}
