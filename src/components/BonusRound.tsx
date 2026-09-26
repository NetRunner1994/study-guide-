import { useCallback, useEffect, useRef, useState } from 'react'
import { buzz, play } from '../lib/feedback'

interface Target {
  id: number
  x: number
  y: number
  kind: 'threat' | 'friendly'
  bornAt: number
}

interface Props {
  /** Seconds the round lasts. */
  seconds: number
  sound: boolean
  haptics: boolean
  onDone: (points: number, hits: number) => void
}

const HIT = 25
const PENALTY = 15
/** How long a target stays on screen before it escapes. */
const LIFETIME = 1500
const SPAWN_MS = 430

/* Friendlies are worth avoiding, so the round is aim rather than mashing. */
const THREATS = ['🦠', '🐛', '👾', '💀', '🔓']
const FRIENDLIES = ['🛡️', '🔒']

export function BonusRound({ seconds, sound, haptics, onDone }: Props) {
  const [targets, setTargets] = useState<Target[]>([])
  const [points, setPoints] = useState(0)
  const [hits, setHits] = useState(0)
  const [combo, setCombo] = useState(0)
  const [remaining, setRemaining] = useState(seconds * 1000)
  const [flash, setFlash] = useState<{ id: number; text: string; good: boolean } | null>(null)

  const nextId = useRef(1)
  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  /* onDone must see the final tallies, not the values captured at mount. */
  const tally = useRef({ points: 0, hits: 0 })

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    play('finish', sound)
    onDone(tally.current.points, tally.current.hits)
  }, [onDone, sound])

  /* Spawn loop. */
  useEffect(() => {
    const id = window.setInterval(() => {
      setTargets((prev) => {
        const now = Date.now()
        const alive = prev.filter((t) => now - t.bornAt < LIFETIME)
        if (alive.length >= 5) return alive
        return [
          ...alive,
          {
            id: nextId.current++,
            x: 8 + Math.random() * 76,
            y: 12 + Math.random() * 62,
            kind: Math.random() < 0.8 ? 'threat' : 'friendly',
            bornAt: now,
          },
        ]
      })
    }, SPAWN_MS)
    return () => window.clearInterval(id)
  }, [])

  /* Countdown and expiry sweep. */
  useEffect(() => {
    const id = window.setInterval(() => {
      const left = seconds * 1000 - (Date.now() - startedAt.current)
      setRemaining(Math.max(0, left))
      setTargets((prev) => prev.filter((t) => Date.now() - t.bornAt < LIFETIME))
      if (left <= 0) finish()
    }, 90)
    return () => window.clearInterval(id)
  }, [seconds, finish])

  useEffect(() => {
    if (!flash) return
    const id = window.setTimeout(() => setFlash(null), 520)
    return () => window.clearTimeout(id)
  }, [flash])

  const shoot = (target: Target) => {
    setTargets((prev) => prev.filter((t) => t.id !== target.id))
    if (target.kind === 'friendly') {
      tally.current.points = Math.max(0, tally.current.points - PENALTY)
      setPoints(tally.current.points)
      setCombo(0)
      setFlash({ id: target.id, text: `-${PENALTY}`, good: false })
      play('wrong', sound)
      buzz([18, 30, 18], haptics)
      return
    }
    const nextCombo = combo + 1
    const gain = HIT + Math.min(nextCombo - 1, 5) * 5
    tally.current.points += gain
    tally.current.hits += 1
    setPoints(tally.current.points)
    setHits(tally.current.hits)
    setCombo(nextCombo)
    setFlash({ id: target.id, text: `+${gain}`, good: true })
    play('tick', sound)
    buzz(12, haptics)
  }

  /* Number keys hit the matching target, so the round is playable on a laptop. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (!n || n > targets.length) return
      shoot(targets[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const ratio = remaining / (seconds * 1000)

  return (
    <div className="bonus" role="dialog" aria-label="Bonus round">
      <div className="bonus__head">
        <span className="bonus__title">⚡ BREACH</span>
        <span className="tiny mono muted">
          {hits} neutralised · +{points}
        </span>
      </div>
      <div className="timer-bar">
        <div
          className={`timer-bar__fill ${ratio < 0.3 ? 'timer-bar__fill--warn' : ''}`}
          style={{ width: `${ratio * 100}%`, transition: 'width .1s linear' }}
        />
      </div>

      <div className="bonus__field">
        {targets.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={`bonus__target ${t.kind === 'friendly' ? 'bonus__target--friendly' : ''}`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            onPointerDown={(e) => {
              e.preventDefault()
              shoot(t)
            }}
            aria-label={t.kind === 'friendly' ? 'Friendly, do not hit' : 'Threat'}
          >
            <span aria-hidden="true">
              {t.kind === 'friendly'
                ? FRIENDLIES[t.id % FRIENDLIES.length]
                : THREATS[t.id % THREATS.length]}
            </span>
            <span className="bonus__key">{i + 1}</span>
          </button>
        ))}
        {flash ? (
          <span className={`bonus__flash ${flash.good ? '' : 'bonus__flash--bad'}`}>
            {flash.text}
          </span>
        ) : null}
      </div>

      <p className="tiny faint center">
        Hit the threats, spare the shields. Combo builds with every clean hit.
      </p>
    </div>
  )
}
