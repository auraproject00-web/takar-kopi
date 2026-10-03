import { afterEach, describe, expect, it, vi } from 'vitest'
import { FakeAudioContext, installFakeAudio, removeFakeAudio } from '../test/fakeAudio'

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

async function freshCues() {
  vi.resetModules()
  return import('./cues')
}

describe('buzz', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, 'vibrate')
    Reflect.deleteProperty(HTMLInputElement.prototype, 'switch')
    document.body.innerHTML = ''
  })

  it('uses the Vibration API where it exists (Android)', async () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    const { buzz, canBuzz } = await freshCues()
    expect(canBuzz()).toBe(true)
    buzz([200, 100, 200])
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200])
  })

  it('falls back to the iOS 18 switch haptic on iPhone, one tap per pulse', async () => {
    vi.useFakeTimers()
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA)
    Object.defineProperty(HTMLInputElement.prototype, 'switch', { value: false, configurable: true, writable: true })
    const clicks = vi.spyOn(HTMLLabelElement.prototype, 'click')
    const { buzz, canBuzz } = await freshCues()
    expect(canBuzz()).toBe(true)

    buzz([200, 100, 200])
    vi.runAllTimers()
    expect(clicks).toHaveBeenCalledTimes(2)
    const input = document.querySelector('input[switch]')
    expect(input).not.toBeNull()
    expect(input?.closest('label')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('reports no buzz on iPhones without switch support (before iOS 18)', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA)
    const { buzz, canBuzz } = await freshCues()
    expect(canBuzz()).toBe(false)
    expect(() => buzz()).not.toThrow()
  })
})

describe('beep', () => {
  afterEach(removeFakeAudio)

  it('stays silent until audio is unlocked by a tap', async () => {
    installFakeAudio()
    const { beep } = await freshCues()
    beep()
    expect(FakeAudioContext.instances).toHaveLength(0)
  })

  it('plays loud square-wave pulses near 2 kHz through a low-pass filter', async () => {
    installFakeAudio()
    const { beep, unlockAudio, BEEP } = await freshCues()
    unlockAudio()
    beep(3)
    const ctx = FakeAudioContext.instances[0]!
    expect(ctx.oscillators).toHaveLength(3)
    for (const osc of ctx.oscillators) {
      expect(osc.type).toBe('square')
      expect(osc.frequency.value).toBe(2000)
    }
    // Pulses follow each other without overlapping.
    const starts = ctx.oscillators.map((o) => o.start.mock.calls[0]![0] as number)
    expect(starts[1]! - starts[0]!).toBeCloseTo(BEEP.pulseSec + BEEP.gapSec)
    // Each pulse reaches its full level, which leaves headroom below clipping.
    const peaks = ctx.gains.map((g) => Math.max(...g.gain.events.map((e) => e[1])))
    expect(peaks).toEqual([0.7, 0.7, 0.7])
    expect((4 / Math.PI) * BEEP.peak).toBeLessThan(1)
    expect(ctx.filters).toHaveLength(1)
    expect(ctx.filters[0]!.type).toBe('lowpass')
    expect(ctx.filters[0]!.outputs).toEqual([ctx.destination])
  })

  it('wakes a suspended context before playing', async () => {
    installFakeAudio()
    const { beep, unlockAudio } = await freshCues()
    unlockAudio()
    const ctx = FakeAudioContext.instances[0]!
    ctx.state = 'suspended'
    beep()
    expect(ctx.resume).toHaveBeenCalled()
  })
})
