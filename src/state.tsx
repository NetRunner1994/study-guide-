import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { evaluateBadges } from './lib/game'
import { loadQuestions } from './lib/questions'
import { emptyStat, schedule } from './lib/srs'
import {
  clearProgress,
  emptyProgress,
  loadProgress,
  saveProgress,
  today,
  touchDay,
} from './lib/storage'
import type { Progress, Question, SessionRecord, Settings } from './lib/types'

interface Store {
  questions: Question[]
  loading: boolean
  progress: Progress
  recordAnswer: (questionId: number, correct: boolean, xp: number) => void
  finishSession: (record: SessionRecord, runBestStreak: number) => string[]
  toggleFlag: (questionId: number) => void
  markKnown: (questionId: number, known: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetProgress: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress>(() =>
    typeof window === 'undefined' ? emptyProgress() : loadProgress(),
  )
  /* finishSession needs the freshest progress synchronously to award badges. */
  const latest = useRef(progress)
  latest.current = progress

  useEffect(() => {
    let alive = true
    loadQuestions()
      .then((data) => {
        if (!alive) return
        setQuestions(data)
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const recordAnswer = useCallback((questionId: number, correct: boolean, xp: number) => {
    setProgress((prev) => {
      const day = today()
      const base = touchDay(prev, day)
      const stat = base.stats[questionId] ?? emptyStat()
      return {
        ...base,
        xp: base.xp + xp,
        daily: { ...base.daily, [day]: (base.daily[day] ?? 0) + 1 },
        stats: { ...base.stats, [questionId]: schedule(stat, correct) },
      }
    })
  }, [])

  const finishSession = useCallback(
    (record: SessionRecord, runBestStreak: number) => {
      const withStreak: Progress = {
        ...latest.current,
        bestStreak: Math.max(latest.current.bestStreak, runBestStreak),
        history: [record, ...latest.current.history].slice(0, 60),
      }
      const earned = evaluateBadges(withStreak, questions, record, runBestStreak)
      const now = Date.now()
      const badges = { ...withStreak.badges }
      for (const id of earned) badges[id] = now
      setProgress({ ...withStreak, badges })
      return earned
    },
    [questions],
  )

  const toggleFlag = useCallback((questionId: number) => {
    setProgress((prev) => {
      const stat = prev.stats[questionId] ?? emptyStat()
      return { ...prev, stats: { ...prev.stats, [questionId]: { ...stat, flagged: !stat.flagged } } }
    })
  }, [])

  const markKnown = useCallback((questionId: number, known: boolean) => {
    setProgress((prev) => {
      const stat = prev.stats[questionId] ?? emptyStat()
      return {
        ...prev,
        stats: {
          ...prev.stats,
          [questionId]: { ...stat, known, seen: Math.max(1, stat.seen) },
        },
      }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProgress((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const resetProgress = useCallback(() => {
    clearProgress()
    setProgress(emptyProgress())
  }, [])

  const value = useMemo<Store>(
    () => ({
      questions,
      loading,
      progress,
      recordAnswer,
      finishSession,
      toggleFlag,
      markKnown,
      updateSettings,
      resetProgress,
    }),
    [
      questions,
      loading,
      progress,
      recordAnswer,
      finishSession,
      toggleFlag,
      markKnown,
      updateSettings,
      resetProgress,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
