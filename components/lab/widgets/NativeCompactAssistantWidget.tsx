'use client'

import CompactAssistant from '@/components/dashboard/CompactAssistant'

export default function NativeCompactAssistantWidget({ space = 'school' }: { space?: string }) {
  return <CompactAssistant space={space} />
}
