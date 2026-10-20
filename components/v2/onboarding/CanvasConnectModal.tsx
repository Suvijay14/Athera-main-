'use client'

export default function CanvasConnectModal({
  open,
  token,
  connecting,
  onTokenChange,
  onClose,
  onConnect,
}: {
  open: boolean
  token: string
  connecting: boolean
  onTokenChange: (v: string) => void
  onClose: () => void
  onConnect: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4">
      <div className="card-v2 w-full max-w-md p-6 shadow-serenity-lg">
        <h3 className="font-jakarta text-headline-md text-primary mb-2">Connect bCourses</h3>
        <p className="text-body-sm text-secondary mb-4 leading-relaxed">
          bCourses uses a personal access token. Create one in Approved Integrations, paste it here,
          and Athera stores it locally on this Mac.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="Paste bCourses access token"
          className="w-full px-3 py-2.5 text-body-md border border-border-serenity rounded-xl bg-surface-container-low mb-4"
          autoComplete="off"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary text-sm" disabled={connecting}>
            Cancel
          </button>
          <button type="button" onClick={onConnect} className="btn-primary text-sm" disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
