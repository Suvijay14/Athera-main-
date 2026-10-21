/** Routes that use the mockup-aligned workspace shell (sidebar + top bar), not legacy v2 chrome. */
export function usesWorkspaceChrome(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false
  }
  if (pathname === '/') {
    return true
  }
  return pathname.startsWith('/workspace')
}
