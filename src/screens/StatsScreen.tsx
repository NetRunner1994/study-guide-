import { useMemo } from 'react'
import { badgesForExam, MODES, levelProgress } from '../lib/game'
import { useStore } from '../state'

export function StatsScreen() {
  const { exam, questions, progress, current } = useStore()

  const perDomain = useMemo(
    () =>
      exam.domains.map((domain) => {
        let correct = 0
        let total = 0
        let seen = 0
        let count = 0
        for (const q of questions) {
          if (q.domain !== domain.id) continue
          count += 1
          const stat = current.stats[q.id]
          if (!stat) continue
          if (stat.seen) seen += 1
          correct += stat.correct
          total += stat.correct + stat.wrong
        }
        return {
          ...domain,
          count,
          seen,
          answered: total,
          accuracy: total ? correct / total : 0,
          coverage: count ? seen / count : 0,
        }
      }),
    [questions, current.stats, exam.domains],
  )

  const level = levelProgress(current.xp)
  const badges = badgesForExam(exam)
  const totals = useMemo(() => {
    const stats = Object.values(current.stats)
    const answered = stats.reduce((n, s) => n + s.correct + s.wrong, 0)
    const correct = stats.reduce((n, s) => n + s.correct, 0)
    return { answered, correct, accuracy: answered ? correct / answered : 0 }
  }, [current.stats])

  const last14 = useMemo(() => {
    const days: { day: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
      days.push({ day: key, count: progress.daily[key] ?? 0 })
    }
    return days
  }, [progress.daily])

  const peak = Math.max(1, ...last14.map((d) => d.count))

  return (
    <div className="screen stack">
      <header className="topbar">
        <div>
          <p className="eyebrow">Your progress</p>
          <h1 className="topbar__title">Stats</h1>
          <p className="topbar__sub">{exam.name} · {exam.code}</p>
        </div>
        <span className="pill">Lv {level.level}</span>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value mono">{totals.answered.toLocaleString()}</div>
          <div className="stat__label">Answered</div>
        </div>
        <div className="stat">
          <div className="stat__value mono">{Math.round(totals.accuracy * 100)}%</div>
          <div className="stat__label">Accuracy</div>
        </div>
        <div className="stat">
          <div className="stat__value mono">{progress.dayStreak}</div>
          <div className="stat__label">Day streak</div>
        </div>
      </div>

      <section className="card stack--sm">
        <span className="eyebrow">Last 14 days</span>
        <div className="row" style={{ gap: 4, alignItems: 'flex-end', height: 74 }}>
          {last14.map((day) => (
            <div key={day.day} className="grow" title={`${day.day}: ${day.count} answered`}>
              <div
                style={{
                  height: Math.max(3, (day.count / peak) * 66),
                  borderRadius: 5,
                  background: day.count
                    ? 'linear-gradient(180deg, #22d3ee, #7c3aed)'
                    : 'rgba(255,255,255,0.08)',
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <span className="eyebrow">Mastery by objective</span>
        {perDomain.map((domain) => (
          <div className="domain-row" key={domain.id}>
            <div className="row row--between">
              <span className="small" style={{ fontWeight: 650 }}>
                {domain.short}
              </span>
              <span className="tiny mono faint">
                {domain.answered ? `${Math.round(domain.accuracy * 100)}%` : '—'} · {domain.seen}/
                {domain.count}
              </span>
            </div>
            <div className="bar">
              <div
                className="bar__fill"
                style={{
                  width: `${(domain.answered ? domain.accuracy : 0) * 100}%`,
                  background: domain.accent,
                }}
              />
            </div>
            <span className="tiny faint">
              {domain.weight ? `Exam weight ${domain.weight}%` : `${domain.count} in this bank`}
            </span>
          </div>
        ))}
      </section>

      <section className="card stack--sm">
        <span className="eyebrow">
          Badges · {Object.keys(current.badges).length}/{badges.length}
        </span>
        <div className="badges-grid">
          {badges.map((badge) => {
            const earned = Boolean(current.badges[badge.id])
            return (
              <div
                key={badge.id}
                className={`badge ${earned ? '' : 'badge--locked'}`}
                title={badge.detail}
              >
                <span className="badge__icon">{badge.icon}</span>
                <span className="badge__name">{badge.name}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card stack--sm">
        <span className="eyebrow">Recent sessions</span>
        {current.history.length === 0 ? (
          <p className="small muted">No runs yet — play a round and it will show up here.</p>
        ) : (
          current.history.slice(0, 12).map((run) => (
            <div className="history-row" key={run.id}>
              <span style={{ fontSize: 18 }}>{MODES[run.mode].icon}</span>
              <div className="grow">
                <div className="small" style={{ fontWeight: 650 }}>
                  {MODES[run.mode].name}
                  {run.scaled !== null ? ` · ${run.scaled}/900` : ''}
                </div>
                <div className="tiny faint">
                  {new Date(run.date).toLocaleDateString()} · {run.correct}/{run.total} correct
                </div>
              </div>
              <span className="pill mono">{run.score.toLocaleString()}</span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
