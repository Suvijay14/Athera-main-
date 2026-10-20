import AppShell from '@/components/AppShell'
import { getOptionalUser } from '@/lib/supabase/get-optional-user'

export async function ShellGate({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser()
  if (!user) {
    return <>{children}</>
  }
  return <AppShell>{children}</AppShell>
}
