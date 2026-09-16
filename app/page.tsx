import SpacePage from '@/components/SpacePage'

export default function Home() {
  return (
    <>
      <div className="flex items-center justify-center py-20">
        <h1 className="text-8xl font-bold tracking-tight">hello</h1>
      </div>
      <SpacePage space="school" label="School" />
    </>
  )
}
