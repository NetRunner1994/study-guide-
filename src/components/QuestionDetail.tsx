import { domainMeta } from '../lib/exams'
import { useStore } from '../state'
import type { Question } from '../lib/types'

/** The full answer + explanation block, shared by Study mode and the quiz verdict. */
export function QuestionDetail({ question, showOptions = true }: { question: Question; showOptions?: boolean }) {
  if (question.type === 'pbq') {
    return (
      <>
        {question.summary?.map((line, i) => (
          <p key={i} className="small muted">
            {line}
          </p>
        ))}
        <div className="pairs">
          {question.pairs?.map((pair, i) => (
            <div className="pair" key={i}>
              <span>{pair.item}</span>
              <span className="pair__arrow">→</span>
              <strong>{pair.match}</strong>
            </div>
          ))}
        </div>
        {question.steps?.length ? (
          <div className="stack--sm">
            <span className="eyebrow">How to work it out</span>
            <ul className="steps">
              {question.steps.map((step, i) => (
                <li key={i}>
                  <span>{step.replace(/^\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </>
    )
  }

  const answer = question.answer ?? []
  return (
    <>
      {showOptions && question.options ? (
        <div>
          {question.options.map((option) => {
            const right = answer.includes(option.letter)
            return (
              <div key={option.letter} className={`opt-line ${right ? 'opt-line--right' : ''}`}>
                <span className="opt-line__key">{option.letter}</span>
                <span>{option.text}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="answer-line">
        <span>✅</span>
        <span>
          <strong>{answer.join(' + ')}</strong>
          {question.answerText ? ` — ${question.answerText}` : ''}
        </span>
      </div>

      <div className="verdict__body">
        {question.explanation?.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {question.why && Object.keys(question.why).length ? (
        <div className="stack--sm">
          <span className="eyebrow">Why the other options are wrong</span>
          <div className="why">
            {Object.entries(question.why).map(([letter, reason]) => (
              <div className="why__row" key={letter}>
                <span className="why__key">{letter}</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

export function DomainChip({ domain }: { domain: string }) {
  const { exam } = useStore()
  const meta = domainMeta(exam, domain)
  return (
    <span className="chip chip--dot tiny" style={{ ['--dot' as string]: meta.accent }}>
      {meta.short}
    </span>
  )
}
