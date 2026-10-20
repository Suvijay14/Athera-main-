/** First-name-ish label from auth email for overview greeting. */
export function displayNameFromEmail(email: string | undefined): string {
  if (!email?.trim()) {
    return 'there'
  }
  const local = email.split('@')[0] ?? ''
  const segment = local.split(/[.+_-]/)[0] ?? local
  const trimmed = segment.trim()
  if (!trimmed) {
    return 'there'
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}
