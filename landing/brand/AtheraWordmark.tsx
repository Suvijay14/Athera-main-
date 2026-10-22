import clsx from 'clsx'

function MarkA({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 20" className={clsx('inline-block w-[0.55em] h-[0.85em]', className)} aria-hidden>
      <path
        d="M8 3 L14 17 M8 3 L2 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type AtheraWordmarkProps = {
  className?: string
}

export default function AtheraWordmark({ className }: AtheraWordmarkProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-[0.38em] uppercase font-extralight tracking-[0.38em] text-sage font-inter',
        className
      )}
      aria-label="Athera"
    >
      <MarkA />
      <span>T</span>
      <span>H</span>
      <span>E</span>
      <span>R</span>
      <MarkA />
    </span>
  )
}
