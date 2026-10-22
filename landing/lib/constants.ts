/** Set true when quote permissions are confirmed. */
export const SHOW_QUOTES = false

export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  process.env.NEXT_PUBLIC_CALENDLY_DESIGN_PARTNER_URL ??
  'https://calendly.com/your-athera-link/design-partner'

/** @deprecated Use CALENDLY_URL */
export const CALENDLY_DESIGN_PARTNER_URL = CALENDLY_URL

/**
 * Landing autoplay pacing. Original demos were ~2× slower; 0.5 keeps motion readable
 * but advances hero steps and feature carousels much faster.
 */
export const LANDING_DEMO_TIME_SCALE = 0.5

export function scaleLandingDemoMs(ms: number): number {
  return Math.max(60, Math.round(ms * LANDING_DEMO_TIME_SCALE))
}

/** Framer Motion `duration` values (seconds). */
export function scaleLandingDemoSec(sec: number): number {
  return Math.max(0.08, sec * LANDING_DEMO_TIME_SCALE)
}

/** Default dwell time per step in feature-section carousels. */
export const LANDING_FEATURE_STEP_MS = scaleLandingDemoMs(5200)
