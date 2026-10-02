/** Step-change signals: a short beep and a buzz. Both silently do nothing where unsupported. */

let audio: AudioContext | null = null

/** Must run inside a tap handler: browsers only allow audio after a user gesture. */
export function unlockAudio(): void {
  if (audio || typeof window === 'undefined' || !('AudioContext' in window)) return
  try {
    audio = new AudioContext()
  } catch {
    audio = null
  }
}

export function beep(times = 1): void {
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()
  for (let i = 0; i < times; i++) {
    const startAt = audio.currentTime + i * 0.22
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.3, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16)
    osc.connect(gain).connect(audio.destination)
    osc.start(startAt)
    osc.stop(startAt + 0.18)
  }
}

export function buzz(pattern: number | number[] = 200): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}
