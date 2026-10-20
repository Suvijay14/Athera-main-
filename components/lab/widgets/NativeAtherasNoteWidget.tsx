'use client'

import AtherasNote from '@/components/AtherasNote'

export default function NativeAtherasNoteWidget({ space = 'school' }: { space?: string }) {
  return (
    <div className="min-h-[200px]">
      <AtherasNote space={space} />
    </div>
  )
}
