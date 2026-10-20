import ComponentPreviewPage from '@/components/lab/ComponentPreviewPage'

export const metadata = {
  title: 'Component preview — Athera',
}

export default function ComponentPreviewRoute({
  params,
}: {
  params: { id: string }
}) {
  return <ComponentPreviewPage id={params.id} />
}
