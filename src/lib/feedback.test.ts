import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../config', () => ({
  APP_VERSION: '0.9.0',
  FEEDBACK_ENABLED: true,
  FEEDBACK_FORM: {
    action: 'https://docs.google.com/forms/d/e/TEST/formResponse',
    deviceEntry: 'entry.111',
    messageEntry: 'entry.222',
    deviceOptions: { android: 'Android', ios: 'IOS' },
  },
}))

import { flushFeedbackQueue, formBody, guessDevice, pendingFeedbackCount, sendFeedback } from './feedback'

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ type: 'opaque', ok: false, status: 0 })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('feedback', () => {
  it('maps answers onto the Google Form entries, with the app version appended', () => {
    const body = formBody({ device: 'ios', message: '  Timer kurang keras  ' })
    expect(body.get('entry.111')).toBe('IOS')
    expect(body.get('entry.222')).toBe('Timer kurang keras\n\n— v0.9.0')
  })

  it('posts in the background without leaving the page', async () => {
    expect(await sendFeedback({ device: 'android', message: 'Mantap' })).toBe('sent')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://docs.google.com/forms/d/e/TEST/formResponse')
    expect(init).toMatchObject({ method: 'POST', mode: 'no-cors' })
    expect(String(init.body)).toContain('entry.111=Android')
  })

  it('keeps feedback when offline and sends it once back online', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(await sendFeedback({ device: 'android', message: 'Offline' })).toBe('queued')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pendingFeedbackCount()).toBe(1)

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    expect(await flushFeedbackQueue()).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(pendingFeedbackCount()).toBe(0)
  })

  it('queues when the request fails, and keeps it if the retry fails too', async () => {
    fetchMock.mockRejectedValue(new TypeError('network'))
    expect(await sendFeedback({ device: 'ios', message: 'Gagal' })).toBe('queued')
    expect(await flushFeedbackQueue()).toBe(0)
    expect(pendingFeedbackCount()).toBe(1)
  })

  it('guesses the device from the browser', () => {
    expect(guessDevice()).toBe('android')
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA)
    expect(guessDevice()).toBe('ios')
  })
})
