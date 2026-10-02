import { afterEach, describe, expect, it, vi } from 'vitest'

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
