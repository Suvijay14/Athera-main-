/** Opens the workspace command bar from anywhere in the v2 shell (TopNav, etc.). */
export const OPEN_COMMAND_BAR_EVENT = 'athera:open-command-bar'

export function dispatchOpenCommandBar(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_BAR_EVENT))
}
