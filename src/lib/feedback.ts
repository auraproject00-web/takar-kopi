import { APP_VERSION, FEEDBACK_FORM } from '../config'

export type Device = keyof typeof FEEDBACK_FORM.deviceOptions

export interface Feedback {
  device: Device
  message: string
}

const QUEUE_KEY = 'cb.feedbackQueue'

function readQueue(): Feedback[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Feedback[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: Feedback[]): void {
  try {
    if (queue.length === 0) localStorage.removeItem(QUEUE_KEY)
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Storage blocked: an offline entry is lost, which beats crashing the form.
  }
}

export function guessDevice(): Device {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios ? 'ios' : 'android'
}

/** The app version rides along at the end of the message so reports can be traced to a release. */
export function formBody(f: Feedback): URLSearchParams {
  return new URLSearchParams({
    [FEEDBACK_FORM.deviceEntry]: FEEDBACK_FORM.deviceOptions[f.device],
    [FEEDBACK_FORM.messageEntry]: `${f.message.trim()}\n\n— v${APP_VERSION}`,
  })
}

/**
 * Google Forms accepts a plain form POST but sends no CORS headers, so the
 * response is opaque: a resolved fetch means it reached Google, a rejected one
 * means the network failed.
 */
async function post(f: Feedback): Promise<void> {
  await fetch(FEEDBACK_FORM.action, { method: 'POST', mode: 'no-cors', body: formBody(f) })
}

/** Sends now, or keeps it for later when offline. */
export async function sendFeedback(f: Feedback): Promise<'sent' | 'queued'> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    writeQueue([...readQueue(), f])
    return 'queued'
  }
  try {
    await post(f)
    return 'sent'
  } catch {
    writeQueue([...readQueue(), f])
    return 'queued'
  }
}

/** Sends anything saved while offline. Safe to call often. */
export async function flushFeedbackQueue(): Promise<number> {
  const queue = readQueue()
  if (queue.length === 0) return 0
  const left: Feedback[] = []
  let sent = 0
  for (const f of queue) {
    try {
      await post(f)
      sent++
    } catch {
      left.push(f)
    }
  }
  writeQueue(left)
  return sent
}

export function pendingFeedbackCount(): number {
  return readQueue().length
}

/** Call once at startup: retries queued feedback now and whenever the phone comes back online. */
export function listenForFeedbackRetry(): void {
  void flushFeedbackQueue()
  window.addEventListener('online', () => void flushFeedbackQueue())
}
