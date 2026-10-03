import { describe, expect, it } from 'vitest'
import { FEEDBACK_ENABLED, FEEDBACK_FORM } from './config'

describe('feedback form config', () => {
  it('points at the real form with both question ids', () => {
    expect(FEEDBACK_ENABLED).toBe(true)
    expect(FEEDBACK_FORM.action).toMatch(/^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/formResponse$/)
    expect(FEEDBACK_FORM.deviceEntry).toMatch(/^entry\.\d+$/)
    expect(FEEDBACK_FORM.messageEntry).toMatch(/^entry\.\d+$/)
    // Must match the form's radio options exactly, or Google drops the answer.
    expect(FEEDBACK_FORM.deviceOptions).toEqual({ android: 'Android', ios: 'IOS' })
  })
})
