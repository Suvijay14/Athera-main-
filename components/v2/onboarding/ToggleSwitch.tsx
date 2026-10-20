'use client'

import clsx from 'clsx'

export default function ToggleSwitch({
  pressed,
  onChange,
  disabled,
  ariaLabel,
}: {
  pressed: boolean
  onChange?: (next: boolean) => void
  disabled?: boolean
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!pressed)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40',
        pressed ? 'bg-primary-container' : 'bg-surface-container-highest',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition duration-200 ease-in-out',
          pressed ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}
