import { Sheet } from './Sheet'
import { examFamilies } from '../lib/exams'
import { useStore } from '../state'

/** The switcher shown in the Home header: current exam, tap to change. */
export function ExamButton({ onOpen }: { onOpen: () => void }) {
  const { exam } = useStore()
  return (
    <button type="button" className="exam-button" onClick={onOpen}>
      <span className="exam-button__icon" style={{ background: `${exam.accent}22` }}>
        {exam.icon}
      </span>
      <span className="exam-button__text">
        <span className="exam-button__name">{exam.name}</span>
        <span className="exam-button__code">{exam.code}</span>
      </span>
      <span className="exam-button__chevron" aria-hidden="true">
        ⌄
      </span>
    </button>
  )
}

export function ExamSheet({ onClose }: { onClose: () => void }) {
  const { exam, setExam, progress } = useStore()

  return (
    <Sheet title="Choose an exam" onClose={onClose}>
      <div className="stack--sm">
        {examFamilies().map((group) => (
          <div key={group.family} className="stack--sm">
            <span className="eyebrow">{group.family}</span>
            {group.exams.map((option) => {
              const slice = progress.exams[option.id]
              const answered = Object.values(slice?.stats ?? {}).reduce(
                (n, s) => n + s.correct + s.wrong,
                0,
              )
              const active = option.id === exam.id
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`exam-option ${active ? 'exam-option--active' : ''}`}
                  onClick={() => {
                    setExam(option.id)
                    onClose()
                  }}
                >
                  <span
                    className="exam-option__icon"
                    style={{ background: `${option.accent}22`, borderColor: `${option.accent}66` }}
                  >
                    {option.icon}
                  </span>
                  <span className="grow">
                    {/* Listed under its family heading, so the part alone identifies it. */}
                    <span className="exam-option__name">{option.part ?? option.name}</span>
                    <span className="exam-option__meta">
                      {option.code} · {answered ? `${answered} answered` : 'Not started'}
                    </span>
                  </span>
                  {active ? <span style={{ color: option.accent }}>✓</span> : null}
                </button>
              )
            })}
          </div>
        ))}
        <p className="tiny faint">
          Progress, streaks and badges are tracked separately for each exam. Your day streak counts
          study on any of them.
        </p>
      </div>
    </Sheet>
  )
}
