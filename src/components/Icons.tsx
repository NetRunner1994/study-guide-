interface IconProps {
  className?: string
}

const base = {
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

export function HomeIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  )
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5 16 12l-6 3.5z" />
    </svg>
  )
}

export function BookIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 4.5h6a2.5 2.5 0 0 1 2.5 2.5V20a2 2 0 0 0-2-2H4z" />
      <path d="M20 4.5h-6A2.5 2.5 0 0 0 11.5 7V20a2 2 0 0 1 2-2H20z" />
    </svg>
  )
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 20v-6" />
      <path d="M13 20V9" />
      <path d="M18 20v-9" />
    </svg>
  )
}

export function GearIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.7 15H2.6a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 2.7h.1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.87.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.3 9v.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.8 1.9z" />
    </svg>
  )
}

export function FlagIcon({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M5 21V4.5h9l-.9 3 .9 3H5" />
      <path d="M5 4.5h13l-1.2 3.5L18 11.5H5" />
    </svg>
  )
}

export function CloseIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function ChevronIcon({ open, ...p }: IconProps & { open?: boolean }) {
  return (
    <svg {...base} {...p} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
