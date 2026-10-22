import Image from 'next/image'
import clsx from 'clsx'
import AtheraMark from '@/components/brand/AtheraMark'
import AtheraWordmark from '@/components/brand/AtheraWordmark'

type AtheraLogoProps = {
  /** Full brand lockup from asset, or built from mark + wordmark */
  variant?: 'full' | 'stacked' | 'mark' | 'inline'
  className?: string
  markSize?: number
  priority?: boolean
}

export default function AtheraLogo({
  variant = 'stacked',
  className,
  markSize = 56,
  priority = false,
}: AtheraLogoProps) {
  if (variant === 'full') {
    return (
      <Image
        src="/brand/athera-logo.jpg"
        alt="Athera"
        width={420}
        height={520}
        priority={priority}
        className={clsx('h-auto w-auto max-w-[min(280px,70vw)]', className)}
      />
    )
  }

  if (variant === 'mark') {
    return <AtheraMark className={className} size={markSize} />
  }

  if (variant === 'inline') {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <AtheraMark size={markSize} />
        <AtheraWordmark className="text-[11px] sm:text-xs" />
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col items-center gap-3', className)}>
      <AtheraMark size={markSize} />
      <AtheraWordmark className="text-xs sm:text-sm" />
    </div>
  )
}
