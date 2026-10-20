'use client'

import { Badge } from '@/components/ctc/ui/Badge'
import { Button } from '@/components/ctc/ui/Button'

export default function UiKitDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  )
}
