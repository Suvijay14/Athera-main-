function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function getSupabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

export function getSupabaseServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return value || null
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return Boolean(getSupabaseServiceRoleKey() && isSupabaseConfigured())
}
