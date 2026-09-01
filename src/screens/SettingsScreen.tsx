import { useState } from 'react'
import { useStore } from '../state'
import type { Settings } from '../lib/types'

const TOGGLES: { key: keyof Settings; label: string; detail: string }[] = [
  { key: 'sound', label: 'Sound effects', detail: 'Short tones for correct, wrong and level up' },
  { key: 'haptics', label: 'Haptics', detail: 'Vibration feedback on supported phones' },
  { key: 'timer', label: 'Per-question timer', detail: 'Turn off to remove the clock pressure' },
  {
    key: 'shuffleOptions',
    label: 'Shuffle answer options',
    detail: 'Stops you memorising positions. Letters stay attached to their text, so they may appear out of order.',
  },
]

export function SettingsScreen() {
  const { progress, updateSettings, resetProgress, questions } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="screen stack">
      <header className="topbar">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1 className="topbar__title">Settings</h1>
        </div>
      </header>

      <section className="card stack">
        {TOGGLES.map((toggle) => (
          <div className="row row--between" key={toggle.key}>
            <div className="grow">
              <div className="small" style={{ fontWeight: 650 }}>
                {toggle.label}
              </div>
              <div className="tiny faint">{toggle.detail}</div>
            </div>
            <button
              type="button"
              role="switch"
              className="toggle"
              aria-checked={progress.settings[toggle.key]}
              aria-label={toggle.label}
              onClick={() => updateSettings({ [toggle.key]: !progress.settings[toggle.key] })}
            />
          </div>
        ))}
      </section>

      <section className="card stack--sm">
        <span className="eyebrow">About this app</span>
        <p className="small muted">
          {questions.length} questions parsed from a CompTIA Security+ SY0-701 practice set, each
          with the correct answer, a full explanation, and a note on why every other option is
          wrong. Everything runs locally in your browser — your progress never leaves the device.
        </p>
        <p className="small muted">
          This is study material, not official CompTIA content, and passing here does not
          guarantee passing the real exam.
        </p>
      </section>

      <section className="card stack--sm">
        <span className="eyebrow">Data</span>
        <p className="small muted">
          Progress, streaks, badges and review scheduling live in this browser's local storage.
          Clearing site data or using a private window starts you over.
        </p>
        {confirmReset ? (
          <div className="stack--sm">
            <p className="small" style={{ color: 'var(--bad)' }}>
              This erases every answer, badge and streak. It cannot be undone.
            </p>
            <button
              type="button"
              className="btn btn--danger btn--block"
              onClick={() => {
                resetProgress()
                setConfirmReset(false)
              }}
            >
              Yes, erase my progress
            </button>
            <button type="button" className="btn btn--block" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </button>
        )}
      </section>
    </div>
  )
}
