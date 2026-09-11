export default function ReflectionsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <span className="label-caps">Journal</span>
        <h1 className="font-newsreader text-3xl text-ink-primary mt-2">Reflections</h1>
        <p className="text-sm text-ink-muted mt-2">
          Weekly notes and patterns will appear here once you start journaling.
        </p>
      </div>

      <div className="card p-8 text-center">
        <p className="text-sm text-ink-faint">No reflections yet.</p>
      </div>
    </div>
  )
}
