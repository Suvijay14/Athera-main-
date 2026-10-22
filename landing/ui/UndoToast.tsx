'use client'

export default function UndoToast({ message = 'Change applied' }: { message?: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-border-delicate bg-ink-primary text-white px-3 py-2 text-xs shadow-lg">
      <span>{message}</span>
      <button type="button" className="font-semibold text-sage-light underline-offset-2 hover:underline">
        Undo
      </button>
    </div>
  )
}
