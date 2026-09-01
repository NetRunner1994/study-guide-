import { BookIcon, ChartIcon, GearIcon, HomeIcon, PlayIcon } from './Icons'
import type { Tab } from '../lib/nav'

const TABS: { id: Tab; label: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'play', label: 'Play', Icon: PlayIcon },
  { id: 'study', label: 'Study', Icon: BookIcon },
  { id: 'stats', label: 'Stats', Icon: ChartIcon },
  { id: 'settings', label: 'Settings', Icon: GearIcon },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="nav" aria-label="Primary">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="nav__item"
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
