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
import { getExam, type Exam } from './lib/exams'
import { evaluateBadges } from './lib/game'
import { loadQuestions } from './lib/questions'
import { emptyStat, schedule } from './lib/srs'
import {
  clearProgress,
  emptyExamProgress,
  emptyProgress,
  examProgress,
  loadProgress,
  saveProgress,
  today,
  touchDay,
} from './lib/storage'
import type { ExamProgress, Progress, Question, SessionRecord, Settings } from './lib/types'

interface Store {
  /** The exam currently being studied; every screen is scoped to it. */
  exam: Exam
  setExam: (examId: string) => void
  questions: Question[]
  loading: boolean
  progress: Progress
  /** Progress for the active exam. */
  current: ExamProgress
  recordAnswer: (questionId: number, correct: boolean, xp: number) => void
  finishSession: (record: SessionRecord, runBestStreak: number) => string[]
  toggleFlag: (questionId: number) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetProgress: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() =>
    typeof window === 'undefined' ? emptyProgress() : loadProgress(),
  )
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const exam = getExam(progress.activeExam)
  const current = examProgress(progress, exam.id)

  /* finishSession needs the freshest progress synchronously to award badges. */
  const latest = useRef(progress)
  latest.current = progress

  /* Each exam's question bank is a separate chunk, fetched when it is selected. */
  useEffect(() => {
    let alive = true
    setLoading(true)
    loadQuestions(exam.id)
      .then((data) => {
        if (!alive) return
        setQuestions(data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setQuestions([])
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [exam.id])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const setExam = useCallback((examId: string) => {
    setProgress((prev) => (prev.activeExam === examId ? prev : { ...prev, activeExam: examId }))
  }, [])

  /** Applies a change to the active exam's slice, leaving other exams untouched. */
  const updateExam = useCallback(
    (examId: string, update: (slice: ExamProgress) => ExamProgress, base?: Progress) => {
      setProgress((prev) => {
        const from = base ?? prev
        return {
          ...from,
          exams: { ...from.exams, [examId]: update(from.exams[examId] ?? emptyExamProgress()) },
        }
      })
    },
    [],
  )

  const recordAnswer = useCallback(
    (questionId: number, correct: boolean, xp: number) => {
      setProgress((prev) => {
        const day = today()
        const dated = touchDay(prev, day)
        const slice = dated.exams[exam.id] ?? emptyExamProgress()
        const stat = slice.stats[questionId] ?? emptyStat()
        return {
          ...dated,
          daily: { ...dated.daily, [day]: (dated.daily[day] ?? 0) + 1 },
          exams: {
            ...dated.exams,
            [exam.id]: {
              ...slice,
              xp: slice.xp + xp,
              stats: { ...slice.stats, [questionId]: schedule(stat, correct) },
            },
          },
        }
      })
    },
    [exam.id],
  )

  const finishSession = useCallback(
    (record: SessionRecord, runBestStreak: number) => {
      const from = latest.current
      const slice = from.exams[exam.id] ?? emptyExamProgress()
      const withRun: ExamProgress = {
        ...slice,
        bestStreak: Math.max(slice.bestStreak, runBestStreak),
        history: [record, ...slice.history].slice(0, 60),
      }
      const earned = evaluateBadges(
        exam,
        withRun,
        from.dayStreak,
        questions,
        record,
        runBestStreak,
      )
      const now = Date.now()
      const badges = { ...withRun.badges }
      for (const id of earned) badges[id] = now
      setProgress({
        ...from,
        exams: { ...from.exams, [exam.id]: { ...withRun, badges } },
      })
      return earned
    },
    [exam, questions],
  )

  const toggleFlag = useCallback(
    (questionId: number) => {
      updateExam(exam.id, (slice) => {
        const stat = slice.stats[questionId] ?? emptyStat()
        return { ...slice, stats: { ...slice.stats, [questionId]: { ...stat, flagged: !stat.flagged } } }
      })
    },
    [exam.id, updateExam],
  )

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProgress((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const resetProgress = useCallback(() => {
    clearProgress()
    setProgress({ ...emptyProgress(), activeExam: exam.id })
  }, [exam.id])

  const value = useMemo<Store>(
    () => ({
      exam,
      setExam,
      questions,
      loading,
      progress,
      current,
      recordAnswer,
      finishSession,
      toggleFlag,
      updateSettings,
      resetProgress,
    }),
    [
      exam,
      setExam,
      questions,
      loading,
      progress,
      current,
      recordAnswer,
      finishSession,
      toggleFlag,
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
