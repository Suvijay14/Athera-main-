import clsx from 'clsx'

type AtheraMarkProps = {
  className?: string
  size?: number
  title?: string
  /** @deprecated Ignored — mark is always the sage “A” badge */
  raster?: boolean
}

/** Sage square badge with “A” (app default mark). */
export default function AtheraMark({
  className,
  size = 56,
  title = 'Athera',
}: AtheraMarkProps) {
  return (
    <div
      className={clsx(
        'shrink-0 rounded-xl bg-sage flex items-center justify-center shadow-sm',
        className
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
    >
      <span
        className="text-white font-semibold font-newsreader leading-none"
        style={{ fontSize: Math.round(size * 0.42) }}
        aria-hidden
      >
        A
      </span>
    </div>
  )
}
