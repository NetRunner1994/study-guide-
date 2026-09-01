let context: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!context) context = new Ctor()
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(freq: number, start: number, duration: number, gain: number, type: OscillatorType) {
  const audio = ctx()
  if (!audio) return
  const osc = audio.createOscillator()
  const amp = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audio.currentTime + start)
  amp.gain.setValueAtTime(0.0001, audio.currentTime + start)
  amp.gain.exponentialRampToValueAtTime(gain, audio.currentTime + start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration)
  osc.connect(amp).connect(audio.destination)
  osc.start(audio.currentTime + start)
  osc.stop(audio.currentTime + start + duration + 0.02)
}

export type Cue = 'correct' | 'wrong' | 'tick' | 'levelUp' | 'finish' | 'tap'

export function play(cue: Cue, enabled: boolean) {
  if (!enabled) return
  try {
    switch (cue) {
      case 'correct':
        tone(660, 0, 0.12, 0.06, 'triangle')
        tone(990, 0.09, 0.16, 0.05, 'triangle')
        break
      case 'wrong':
        tone(200, 0, 0.2, 0.06, 'sawtooth')
        break
      case 'tick':
        tone(880, 0, 0.04, 0.03, 'square')
        break
      case 'levelUp':
        ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.16, 0.05, 'triangle'))
        break
      case 'finish':
        ;[440, 554, 659].forEach((f, i) => tone(f, i * 0.11, 0.24, 0.05, 'sine'))
        break
      case 'tap':
        tone(420, 0, 0.03, 0.02, 'sine')
        break
    }
  } catch {
    /* Audio is a nicety; never let it break a session. */
  }
}

export function buzz(pattern: number | number[], enabled: boolean) {
  if (!enabled) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}
