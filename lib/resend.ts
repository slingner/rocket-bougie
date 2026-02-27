import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

// The "from" address — domain must be verified in the Resend dashboard.
// For local testing you can temporarily use: onboarding@resend.dev
export const FROM_EMAIL = 'Rocket Boogie Co. <orders@rocketboogie.com>'
