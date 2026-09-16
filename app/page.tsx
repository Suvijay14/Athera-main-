import SpacePage from '@/components/SpacePage'

export default function Home() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden"
      >
        <span className="font-newsreader text-[10rem] md:text-[14rem] font-medium text-terracotta/15 select-none leading-none">
          hello
        </span>
      </div>
      <div className="relative z-10">
        <SpacePage space="school" label="School" />
      </div>
    </div>
  )
}
