'use client'

import clsx from 'clsx'

interface DummyControlProps {
  children: React.ReactNode
  className?: string
  title?: string
  as?: 'button' | 'span' | 'div'
}

export default function DummyControl({
  children,
  className,
  title = 'Not wired yet',
  as = 'button',
}: DummyControlProps) {
  const classes = clsx('dummy-control', className)

  if (as === 'span') {
    return (
      <span className={classes} title={title}>
        {children}
      </span>
    )
  }

  if (as === 'div') {
    return (
      <div className={classes} title={title}>
        {children}
      </div>
    )
  }

  return (
    <button type="button" className={classes} title={title}>
      {children}
    </button>
  )
}
