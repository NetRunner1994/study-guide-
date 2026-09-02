import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronIcon, FlagIcon } from '../components/Icons'
import { DomainChip, QuestionDetail } from '../components/QuestionDetail'

import { plainText } from '../lib/questions'
import { isDue, mastery } from '../lib/srs'
import { useStore } from '../state'
import type { Question } from '../lib/types'

type Filter = 'all' | 'flagged' | 'missed' | 'due' | 'unseen' | 'pbq'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'flagged', label: '⚑ Flagged' },
  { id: 'missed', label: 'Missed' },
  { id: 'due', label: 'Due' },
  { id: 'unseen', label: 'Unseen' },
  { id: 'pbq', label: 'Simulations' },
]

const PAGE = 25

export function StudyScreen() {
  const { exam, questions, current, toggleFlag } = useStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [domain, setDomain] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const deferredQuery = useDeferredValue(query)

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    return questions.filter((q) => {
      if (domain && q.domain !== domain) return false
      const stat = current.stats[q.id]
      switch (filter) {
        case 'flagged':
          if (!stat?.flagged) return false
          break
        case 'missed':
          if (!stat || stat.wrong === 0) return false
          break
        case 'due':
          if (!isDue(stat)) return false
          break
        case 'unseen':
          if (stat?.seen) return false
          break
        case 'pbq':
          if (q.type !== 'pbq') return false
          break
        default:
          break
      }
      if (!needle) return true
      return plainText(q).includes(needle)
    })
  }, [questions, deferredQuery, filter, domain, current.stats])

  const visible = results.slice(0, limit)

  return (
    <div className="screen stack">
      <header className="topbar">
        <div>
          <p className="eyebrow">Study guide</p>
          <h1 className="topbar__title">Question bank</h1>
          <p className="topbar__sub">
            {exam.code} · {results.length} of {questions.length} questions
          </p>
        </div>
      </header>

      <input
        className="search"
        type="search"
        inputMode="search"
        placeholder="Search questions, answers, explanations…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setLimit(PAGE)
        }}
      />

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip ${filter === f.id ? 'chip--active' : ''}`}
            onClick={() => {
              setFilter(f.id)
              setLimit(PAGE)
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="filters">
        <button
          type="button"
          className={`chip ${domain === null ? 'chip--active' : ''}`}
          onClick={() => {
            setDomain(null)
            setLimit(PAGE)
          }}
        >
          Every objective
        </button>
        {exam.domains.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip chip--dot ${domain === d.id ? 'chip--active' : ''}`}
            style={{ ['--dot' as string]: d.accent }}
            onClick={() => {
              setDomain(domain === d.id ? null : d.id)
              setLimit(PAGE)
            }}
          >
            {d.short}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <span className="empty__icon">🔍</span>
          <p>Nothing matches those filters yet.</p>
        </div>
      ) : (
        <div className="stack--sm">
          {visible.map((question) => (
            <StudyEntry
              key={question.id}
              question={question}
              open={open === question.id}
              onToggle={() => setOpen(open === question.id ? null : question.id)}
              flagged={Boolean(current.stats[question.id]?.flagged)}
              onFlag={() => toggleFlag(question.id)}
              masteryValue={mastery(current.stats[question.id])}
            />
          ))}
        </div>
      )}

      {limit < results.length ? (
        <button type="button" className="btn btn--block" onClick={() => setLimit((l) => l + PAGE)}>
          Load {Math.min(PAGE, results.length - limit)} more
        </button>
      ) : null}
    </div>
  )
}

interface EntryProps {
  question: Question
  open: boolean
  onToggle: () => void
  flagged: boolean
  onFlag: () => void
  masteryValue: number
}

function StudyEntry({ question, open, onToggle, flagged, onFlag, masteryValue }: EntryProps) {
  /* Simulations open with their scenario; multiple choice ends with the actual question. */
  const isPbq = question.type === 'pbq'
  const lead = (isPbq ? question.prompt[0] : question.prompt[question.prompt.length - 1]) ?? ''
  const context = isPbq ? question.prompt.slice(1) : question.prompt.slice(0, -1)

  return (
    <article className="entry">
      <button type="button" className="entry__head" onClick={onToggle} aria-expanded={open}>
        <div className="entry__meta">
          <span className="tiny faint mono">#{question.id}</span>
          <DomainChip domain={question.domain} />
          {isPbq ? <span className="pill">{question.format ?? 'Simulation'}</span> : null}
          {question.type === 'multi' ? <span className="pill">Choose 2+</span> : null}
          {flagged ? <span className="pill" style={{ color: 'var(--warn)' }}>⚑</span> : null}
          {masteryValue > 0 ? (
            <span className="pill mono" title="Review strength">
              {'▮'.repeat(Math.round(masteryValue * 5)).padEnd(5, '▯')}
            </span>
          ) : null}
        </div>
        <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
          <span className="entry__q grow">{lead}</span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open ? (
        <div className="entry__body">
          {context.length ? (
            <div className="stack--sm">
              {context.map((para, i) => (
                <p key={i} className="small muted">
                  {para}
                </p>
              ))}
            </div>
          ) : null}
          <QuestionDetail question={question} />
          <button
            type="button"
            className="btn btn--sm"
            onClick={onFlag}
            style={{ justifySelf: 'start', color: flagged ? 'var(--warn)' : undefined }}
          >
            <FlagIcon filled={flagged} />
            {flagged ? 'Flagged for review' : 'Flag for review'}
          </button>
        </div>
      ) : null}
    </article>
  )
}
