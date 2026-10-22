export type LandingAnalyticsEvent =
  | 'waitlist_signup'
  | 'design_partner_click'
  | 'persona_selected'
  | 'product_entry_click'
  | 'demo_yes_clicked'
  | 'demo_step_clicked'
  | 'demo_autoplay_resumed'

export function trackLandingEvent(
  event: LandingAnalyticsEvent,
  properties?: Record<string, string>
) {
  if (typeof window === 'undefined') return

  const payload = { event, ...properties, ts: String(Date.now()) }

  window.dispatchEvent(new CustomEvent('athera:analytics', { detail: payload }))

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}
