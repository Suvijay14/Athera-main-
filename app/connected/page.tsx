export default function ConnectedLifePage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <span className="label-caps">Integrations</span>
        <h1 className="font-newsreader text-3xl text-ink-primary mt-2">Connected Life</h1>
        <p className="text-sm text-ink-muted mt-2">
          Calendar, email, tasks, and notes will appear here once connected.
        </p>
      </div>

      <div className="card-vellum p-8 text-center">
        <p className="text-sm text-ink-faint">No integrations connected yet.</p>
      </div>
    </div>
  )
}
