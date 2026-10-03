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

/**
 * Loud enough to hear over a kettle: a square wave near 2 kHz, where phone
 * speakers and our ears are most sensitive, with a low-pass filter taking off
 * the harshest edge. A square carries far more energy than a sine at the same
 * peak; even with only its fundamental left the peak stays below full scale
 * (4/π × 0.7 ≈ 0.89), so nothing clips.
 */
export const BEEP = { hz: 2000, peak: 0.7, pulseSec: 0.24, gapSec: 0.12, lowpassHz: 6000 }

export function beep(times = 1): void {
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = BEEP.lowpassHz
  filter.connect(audio.destination)
  for (let i = 0; i < times; i++) {
    const startAt = audio.currentTime + i * (BEEP.pulseSec + BEEP.gapSec)
    const endAt = startAt + BEEP.pulseSec
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = BEEP.hz
    // Quick fades at both ends avoid clicks; the pulse holds full level in between.
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.linearRampToValueAtTime(BEEP.peak, startAt + 0.01)
    gain.gain.setValueAtTime(BEEP.peak, endAt - 0.03)
    gain.gain.linearRampToValueAtTime(0, endAt)
    osc.connect(gain).connect(filter)
    osc.start(startAt)
    osc.stop(endAt + 0.02)
  }
}

function hasVibrationApi(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/**
 * iOS has no Vibration API, but since iOS 18 Safari plays a light haptic when a
 * `<input type="checkbox" switch>` is toggled through its label. Unofficial, so
 * it may stop working in a future iOS.
 */
function hasIosSwitchHaptic(): boolean {
  if (typeof navigator === 'undefined' || typeof HTMLInputElement === 'undefined') return false
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isIos && 'switch' in HTMLInputElement.prototype
}

export function canBuzz(): boolean {
  return hasVibrationApi() || hasIosSwitchHaptic()
}

let hapticLabel: HTMLLabelElement | null = null

function iosHapticTap(): void {
  if (!hapticLabel) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.id = 'cb-haptic'
    hapticLabel = document.createElement('label')
    hapticLabel.htmlFor = input.id
    hapticLabel.setAttribute('aria-hidden', 'true')
    hapticLabel.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
    hapticLabel.append(input)
    document.body.append(hapticLabel)
  }
  hapticLabel.click()
}

/** `pattern` uses Vibration API timing; on iOS each "on" segment becomes one haptic tap. */
export function buzz(pattern: number | number[] = 200): void {
  if (hasVibrationApi()) {
    navigator.vibrate(pattern)
    return
  }
  if (!hasIosSwitchHaptic()) return
  const segments = Array.isArray(pattern) ? pattern : [pattern]
  let delay = 0
  segments.forEach((ms, i) => {
    if (i % 2 === 0) setTimeout(iosHapticTap, delay)
    delay += ms
  })
}
