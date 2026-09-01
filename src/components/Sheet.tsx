import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet__panel" onClick={(e) => e.stopPropagation()}>
        <div className="row row--between">
          <h2 style={{ fontSize: 17 }}>{title}</h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose} aria-label="Close">
            <CloseIcon className="" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
