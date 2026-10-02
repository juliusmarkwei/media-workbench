export interface SegOption {
  value: string
  label: string
  disabled?: boolean
}

interface SegmentedTabsProps {
  options: SegOption[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  size?: 'sm' | 'md'
}

export default function SegmentedTabs({ options, value, onChange, ariaLabel, size = 'md' }: SegmentedTabsProps) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const pct = 100 / options.length
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-2 py-2 text-xs sm:text-sm'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative flex border border-zinc-300 bg-zinc-900/[0.03] dark:border-zinc-700 dark:bg-white/[0.03]"
    >
      <span
        aria-hidden
        className="seg-pill absolute inset-y-0 bg-zinc-900 shadow-sm dark:bg-zinc-100"
        style={{ left: `${index * pct}%`, width: `${pct}%` }}
      />
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            disabled={o.disabled}
            onClick={() => !o.disabled && onChange(o.value)}
            className={`relative z-10 flex-1 font-mono font-medium transition-colors ${pad} ${
              active
                ? 'text-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
