import { useCallback, useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { HomeScreen } from './screens/HomeScreen'
import { PlayScreen } from './screens/PlayScreen'
import { QuizScreen, type QuizRun } from './screens/QuizScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { StudyScreen } from './screens/StudyScreen'
import { buildSession } from './lib/session'
import { useStore } from './state'
import type { Tab } from './lib/nav'
import type { AnswerOutcome, ModeId, SessionRecord } from './lib/types'

interface Finished {
  record: SessionRecord
  outcomes: AnswerOutcome[]
  earned: string[]
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export function App() {
  const { exam, questions, loading, current } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [run, setRun] = useState<QuizRun | null>(null)
  const [finished, setFinished] = useState<Finished | null>(null)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  /* The hardware back button should leave a run rather than the app. */
  useEffect(() => {
    if (!run && !finished) return
    window.history.pushState({ quiz: true }, '')
    const onPop = () => {
      setRun(null)
      setFinished(null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [run, finished])

  const startRun = useCallback(
    (mode: ModeId, domain?: string) => {
      const list = buildSession(questions, current, { mode, domain: domain ?? null })
      setFinished(null)
      setRun({ mode, domain: domain ?? null, questions: list })
      window.scrollTo({ top: 0 })
    },
    [questions, current],
  )

  if (loading) {
    return (
      <div className="splash">
        <svg className="splash__mark" viewBox="0 0 512 512" width={72} height={72} aria-hidden="true">
          <defs>
            <linearGradient id="splashMark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <path
            d="M256 92l124 50v112c0 92-52 142-124 166-72-24-124-74-124-166V142z"
            fill="none"
            stroke="url(#splashMark)"
            strokeWidth={26}
            strokeLinejoin="round"
          />
          <path
            d="M198 258l40 42 78-86"
            fill="none"
            stroke="url(#splashMark)"
            strokeWidth={30}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <h1 style={{ fontSize: 20 }}>CompTIA Arcade</h1>
          <p className="small muted">Loading the {exam.code} question bank…</p>
        </div>
      </div>
    )
  }

  if (finished) {
    return (
      <ResultsScreen
        record={finished.record}
        outcomes={finished.outcomes}
        earned={finished.earned}
        questions={questions}
        onReplay={(mode, domain) => startRun(mode, domain)}
        onHome={() => {
          setFinished(null)
          setTab('home')
        }}
      />
    )
  }

  if (run) {
    return (
      <QuizScreen
        key={exam.id}
        run={run}
        onExit={() => setRun(null)}
        onFinish={(record, outcomes, earned) => {
          setRun(null)
          setFinished({ record, outcomes, earned })
        }}
      />
    )
  }

  return (
    <div className="app">
      {tab === 'home' ? (
        <HomeScreen
          onPlay={startRun}
          onOpenStudy={() => setTab('study')}
          installPrompt={
            installEvent
              ? () => {
                  void installEvent.prompt()
                  setInstallEvent(null)
                }
              : null
          }
        />
      ) : null}
      {tab === 'play' ? <PlayScreen onPlay={startRun} /> : null}
      {tab === 'study' ? <StudyScreen /> : null}
      {tab === 'stats' ? <StatsScreen /> : null}
      {tab === 'settings' ? <SettingsScreen /> : null}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
