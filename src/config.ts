import pkg from '../package.json'

export const APP_VERSION: string = pkg.version

/**
 * Beta feedback goes to this Google Form, posted in the background from the
 * in-app form so users never leave the app. Entry ids come from the form's
 * "Get pre-filled link" URL (entry.123456789=...). The device values must match
 * the form's radio options exactly.
 */
export const FEEDBACK_FORM = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSeoLmPxDuARaRnJrPXPb5t5qLvqElrcZ-X6zNRePsjCiIJbXQ/formResponse',
  deviceEntry: 'entry.200164114', // "device" (Android / IOS)
  messageEntry: 'entry.264880704', // "fitur aplikasi"
  deviceOptions: { android: 'Android', ios: 'IOS' },
}

/** The in-app form shows only once both entry ids are filled in. */
export const FEEDBACK_ENABLED = FEEDBACK_FORM.deviceEntry !== '' && FEEDBACK_FORM.messageEntry !== ''
