/** Set true when quote permissions are confirmed. */
export const SHOW_QUOTES = false

export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  process.env.NEXT_PUBLIC_CALENDLY_DESIGN_PARTNER_URL ??
  'https://calendly.com/your-athera-link/design-partner'

/** @deprecated Use CALENDLY_URL */
export const CALENDLY_DESIGN_PARTNER_URL = CALENDLY_URL
