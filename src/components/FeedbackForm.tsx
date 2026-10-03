import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n/useI18n'
import { guessDevice, sendFeedback, type Device } from '../lib/feedback'

type Status = 'idle' | 'sending' | 'sent' | 'queued' | 'empty'

/** Feedback form shown inline in Settings; posts to Google Forms in the background. */
export function FeedbackForm() {
  const { t } = useI18n()
  const [device, setDevice] = useState<Device>(guessDevice)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    if (!message.trim()) {
      setStatus('empty')
      return
    }
    setStatus('sending')
    setStatus(await sendFeedback({ device, message }))
    setMessage('')
  }

  if (status === 'sent' || status === 'queued') {
    return (
      <div className="flex flex-col gap-2 py-3" role="status">
        <p className="m-0 text-[15px] font-semibold">{status === 'sent' ? t('feedback.sent') : t('feedback.queued')}</p>
        <button type="button" onClick={() => setStatus('idle')} className="flex min-h-11 items-center self-start font-semibold text-accent">
          {t('feedback.another')}
        </button>
      </div>
    )
  }

  const deviceOptions: { value: Device; label: string }[] = [
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
  ]

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3 py-3" noValidate>
      <p className="m-0 text-[13px] leading-relaxed text-muted">{t('feedback.intro')}</p>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-semibold">{t('feedback.device')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {deviceOptions.map((o) => (
            <label
              key={o.value}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-[15px] font-semibold ${
                device === o.value ? 'border-accent bg-accent/10' : 'border-field bg-surface'
              }`}
            >
              <input
                type="radio"
                name="device"
                value={o.value}
                checked={device === o.value}
                onChange={() => setDevice(o.value)}
                className="size-5 accent-accent"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t('feedback.message')}
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (status === 'empty') setStatus('idle')
          }}
          rows={4}
          maxLength={2000}
          placeholder={t('feedback.placeholder')}
          aria-invalid={status === 'empty'}
          aria-describedby={status === 'empty' ? 'feedback-error' : undefined}
          className="resize-none rounded-xl border border-field bg-surface px-3.5 py-3 text-base font-normal text-ink placeholder:text-faint"
        />
      </label>
      {status === 'empty' && (
        <p id="feedback-error" className="m-0 text-sm font-semibold text-accent">
          {t('feedback.empty')}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
      >
        {status === 'sending' ? t('feedback.sending') : t('feedback.send')}
      </button>
    </form>
  )
}
